const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { notify } = require('../lib/realtime');

router.get('/', asyncH(async (req, res) => {
  const where = { ...(req.query.sport && req.query.sport !== 'All' ? { sport: req.query.sport } : {}), ...(req.query.status ? { status: req.query.status } : {}) };
  res.json({ items: await prisma.event.findMany({ where, orderBy: { createdAt: 'desc' } }) });
}));
router.get('/:id', asyncH(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: { registrations: true } });
  if (!event) fail(404, 'Event not found');
  res.json({ event });
}));
router.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  if (!b.title || !b.sport) fail(400, 'title and sport required');
  res.status(201).json({ event: await prisma.event.create({ data: { title: b.title, sport: b.sport, eventType: b.eventType, venueId: b.venueId, location: b.location, date: b.date, fee: b.fee, slots: b.slots, prize: b.prize, status: 'Draft', organizerId: req.user.id, banner: b.banner, about: b.about } }) });
}));
router.put('/:id', authenticate, asyncH(async (req, res) => {
  const allowed = ['title', 'sport', 'eventType', 'venueId', 'location', 'date', 'fee', 'slots', 'prize', 'status', 'banner', 'about'];
  const data = {}; allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  res.json({ event: await prisma.event.update({ where: { id: req.params.id }, data }) });
}));
router.post('/:id/publish', authenticate, asyncH(async (req, res) => res.json({ event: await prisma.event.update({ where: { id: req.params.id }, data: { status: 'Registration Open' } }) })));
router.post('/:id/cancel', authenticate, asyncH(async (req, res) => res.json({ event: await prisma.event.update({ where: { id: req.params.id }, data: { status: 'Cancelled' } }) })));

// POST /api/events/:id/register
router.post('/:id/register', authenticate, asyncH(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) fail(404, 'Event not found');
  const b = req.body;
  const reg = await prisma.eventRegistration.create({
    data: { eventId: event.id, squadId: b.squadId || null, userId: b.squadId ? null : req.user.id, captainId: req.user.id, membersCount: b.membersCount || 1, status: 'Submitted', paymentStatus: b.pay ? 'Confirmed' : 'Payment Pending' },
  });
  notify(req.user.id, { title: 'Registration submitted', message: `Registered for ${event.title}`, type: 'event', entityType: 'event', entityId: event.id }).catch(() => {});
  res.status(201).json({ registration: reg });
}));
router.get('/:id/registrations', asyncH(async (req, res) => res.json({ items: await prisma.eventRegistration.findMany({ where: { eventId: req.params.id } }) })));
router.post('/registrations/:id/:action', authenticate, asyncH(async (req, res) => {
  const map = { approve: 'Confirmed', reject: 'Rejected', waitlist: 'Waitlisted', checkin: 'Checked In', 'confirm-payment': 'Confirmed' };
  const status = map[req.params.action] || 'Pending';
  res.json({ registration: await prisma.eventRegistration.update({ where: { id: req.params.id }, data: { status } }) });
}));

module.exports = router;
