const router = require('express').Router();
const { prisma, jparse } = require('../lib/prisma');
const { asyncH, fail, pageArgs } = require('../lib/util');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { computeSlots, nextHour } = require('../lib/slots');
const { emitTo } = require('../lib/realtime');

const VENUE_INCLUDE = { gallery: { orderBy: { order: 'asc' } }, facilities: true, sportsList: true, classes: true };
const shape = (v) => ({ ...v, sports: v.sportsList ? v.sportsList.map((s) => s.sport) : [], membership: jparse(v.membership), benefits: jparse(v.benefits), trainers: jparse(v.trainers) });

// GET /api/venues
router.get('/', asyncH(async (req, res) => {
  const { skip, take, page } = pageArgs(req);
  const q = (req.query.q || '').toString(); const { sport, venueType, indoor } = req.query;
  const where = {
    AND: [
      q ? { name: { contains: q } } : {},
      venueType && venueType !== 'All' ? { venueType } : {},
      indoor && indoor !== 'All' ? { indoor } : {},
      sport && sport !== 'All' ? { sportsList: { some: { sport } } } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.venue.findMany({ where, skip, take, include: VENUE_INCLUDE, orderBy: { rating: 'desc' } }),
    prisma.venue.count({ where }),
  ]);
  res.json({ items: rows.map(shape), total, page });
}));

// GET /api/venues/:id
router.get('/:id', asyncH(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id }, include: VENUE_INCLUDE });
  if (!v) fail(404, 'Venue not found');
  res.json({ venue: shape(v) });
}));

// POST /api/venues  (venue owner / admin)
router.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  if (!b.name || !b.venueType) fail(400, 'name and venueType required');
  const v = await prisma.venue.create({
    data: {
      name: b.name, location: b.location, area: b.area, venueType: b.venueType, indoor: b.indoor || 'Indoor',
      pricePerHour: b.pricePerHour || 0, priceUnit: b.priceUnit || 'hour', hours: b.hours || '6:00 AM – 12:00 AM',
      rules: b.rules, ownerId: req.user.id, status: 'Pending',
      sportsList: { create: (b.sports || []).map((s) => ({ sport: s })) },
      facilities: { create: (b.facilities || []).map((f) => ({ name: f })) },
    },
    include: VENUE_INCLUDE,
  });
  res.status(201).json({ venue: shape(v) });
}));

// PUT /api/venues/:id  (owner / admin)
router.put('/:id', authenticate, asyncH(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v) fail(404, 'Venue not found');
  const isAdmin = ['Admin', 'Super Admin', 'Operations Admin', 'Venue Manager'].includes(req.user.role);
  if (v.ownerId !== req.user.id && !isAdmin) fail(403, 'Only the venue owner or admin can edit this venue');
  const allowed = ['name', 'location', 'area', 'venueType', 'indoor', 'pricePerHour', 'priceUnit', 'hours', 'rules', 'image'];
  const data = {}; allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  res.json({ venue: shape(await prisma.venue.update({ where: { id: req.params.id }, data, include: VENUE_INCLUDE })) });
}));

// ── Gallery ──
router.post('/:id/gallery', authenticate, asyncH(async (req, res) => {
  const count = await prisma.venueGallery.count({ where: { venueId: req.params.id } });
  const img = await prisma.venueGallery.create({ data: { venueId: req.params.id, url: req.body.url, caption: req.body.caption || null, order: count, isHero: count === 0 } });
  res.status(201).json({ image: img });
}));
router.delete('/:id/gallery/:imgId', authenticate, asyncH(async (req, res) => { await prisma.venueGallery.delete({ where: { id: req.params.imgId } }).catch(() => {}); res.json({ ok: true }); }));
router.put('/:id/gallery/:imgId/hero', authenticate, asyncH(async (req, res) => {
  await prisma.venueGallery.updateMany({ where: { venueId: req.params.id }, data: { isHero: false } });
  await prisma.venueGallery.update({ where: { id: req.params.imgId }, data: { isHero: true } });
  res.json({ ok: true });
}));
router.put('/:id/gallery/reorder', authenticate, asyncH(async (req, res) => {
  const order = req.body.order || []; // array of imageIds
  await Promise.all(order.map((id, i) => prisma.venueGallery.update({ where: { id }, data: { order: i } }).catch(() => {})));
  res.json({ ok: true });
}));

// ── Time slots ──
// GET /api/venues/:id/slots?date=Today
router.get('/:id/slots', asyncH(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v) fail(404, 'Venue not found');
  const date = (req.query.date || 'Today').toString();
  const dbSlots = await prisma.venueTimeSlot.findMany({ where: { venueId: v.id, date } });
  res.json({ date, slots: computeSlots(v, date, dbSlots) });
}));

// POST /api/venues/:id/slots/reserve  { date, startTime }  → temporary hold (Pending)
router.post('/:id/slots/reserve', authenticate, asyncH(async (req, res) => {
  const { date, startTime } = req.body;
  const existing = await prisma.venueTimeSlot.findUnique({ where: { venueId_date_startTime: { venueId: req.params.id, date, startTime } } });
  if (existing && ['Booked', 'Closed', 'Maintenance'].includes(existing.status)) fail(409, 'That slot is not available');
  const slot = await prisma.venueTimeSlot.upsert({
    where: { venueId_date_startTime: { venueId: req.params.id, date, startTime } },
    update: { status: 'Pending', holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    create: { venueId: req.params.id, date, startTime, endTime: nextHour(startTime), status: 'Pending', holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  emitTo('venue:' + req.params.id, 'slot:update', { date, startTime, status: 'Pending' });
  res.json({ slot });
}));

// POST /api/venues/:id/slots/release  { date, startTime }
router.post('/:id/slots/release', authenticate, asyncH(async (req, res) => {
  const { date, startTime } = req.body;
  await prisma.venueTimeSlot.deleteMany({ where: { venueId: req.params.id, date, startTime, status: { in: ['Pending', 'Selected'] } } });
  emitTo('venue:' + req.params.id, 'slot:update', { date, startTime, status: 'Available' });
  res.json({ ok: true });
}));

// PUT /api/venues/:id/slots/status  { date, startTime, status }  (admin/owner — maintenance/close)
router.put('/:id/slots/status', authenticate, asyncH(async (req, res) => {
  const { date, startTime, status } = req.body;
  const slot = await prisma.venueTimeSlot.upsert({
    where: { venueId_date_startTime: { venueId: req.params.id, date, startTime } },
    update: { status }, create: { venueId: req.params.id, date, startTime, endTime: nextHour(startTime), status },
  });
  emitTo('venue:' + req.params.id, 'slot:update', { date, startTime, status });
  res.json({ slot });
}));

// ── Classes ──
router.get('/:id/classes', asyncH(async (req, res) => res.json({ items: await prisma.classSession.findMany({ where: { venueId: req.params.id } }) })));

module.exports = router;
