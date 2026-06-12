const router = require('express').Router();
const prisma = require('../db');
const rt = require('../realtime');
const { ah, boom, paginate, J, S } = require('../util');
const { notify, followerCount } = require('../helpers');
const { requireAuth } = require('../auth');

const FULL_DAY = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];
const timeToMin = t => { const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); };
const nextHour = t => { const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return t; let tot = ((+m[1]) % 12 + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + (+m[2]) + 60; let nh = Math.floor(tot / 60) % 24, nm = tot % 60, ap = nh >= 12 ? 'PM' : 'AM', hh = nh % 12 || 12; return `${hh}:${String(nm).padStart(2, '0')} ${ap}`; };
const hydrateVenue = v => ({ ...v, sports: J(v.sports, []), facilities: J(v.facilities, []), gallery: J(v.gallery, []), membership: J(v.membership, []), benefits: J(v.benefits, []), classes: J(v.classes, []), trainers: J(v.trainers, []) });

async function isOwnerOrAdmin(venue, user) {
  if (!user) return false;
  const { ADMIN_ROLES } = require('../auth');
  return ADMIN_ROLES.includes(user.role) || venue.ownerId === user.id || venue.managerId === user.id;
}

// ── venues ──
router.get('/venues', ah(async (req, res) => {
  const { skip, take, page } = paginate(req);
  const where = {};
  if (req.query.type && req.query.type !== 'All') where.venueType = req.query.type;
  if (req.query.indoor && req.query.indoor !== 'All') where.indoor = req.query.indoor;
  if (req.query.q) where.name = { contains: req.query.q };
  let [items, total] = await Promise.all([prisma.venue.findMany({ where, skip, take, orderBy: { createdAt: 'asc' } }), prisma.venue.count({ where })]);
  items = items.map(hydrateVenue);
  if (req.query.sport && req.query.sport !== 'All') items = items.filter(v => v.sports.includes(req.query.sport));
  res.json({ items, total, page });
}));

router.get('/venues/:id', ah(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v) throw boom(404, 'Venue not found');
  res.json({ venue: { ...hydrateVenue(v), followers: await followerCount('venue', v.id, v.followersBase) } });
}));

router.post('/venues', requireAuth, ah(async (req, res) => {
  const { ADMIN_ROLES } = require('../auth');
  const canCreate = ADMIN_ROLES.includes(req.user.role) || req.user.role === 'Venue Owner';
  const b = req.body;
  const v = await prisma.venue.create({
    data: {
      name: b.name, venueType: b.venueType || 'Court', indoor: b.indoor || 'Indoor', location: b.location || '', area: b.area,
      sports: S(b.sports || []), facilities: S(b.facilities || []), rules: b.rules, hours: b.hours || '6:00 AM – 12:00 AM',
      openMin: b.openMin || 360, closeMin: b.closeMin || 1440, pricePerHour: b.pricePerHour || 600, priceUnit: b.priceUnit || 'hour',
      hero: b.hero, gallery: S(b.gallery || []), membership: S(b.membership || []), benefits: S(b.benefits || []),
      classes: S(b.classes || []), trainers: S(b.trainers || []), managerId: b.managerId || req.user.id, ownerId: req.user.id,
      status: canCreate ? 'Approved' : 'Pending',
    },
  });
  res.status(201).json({ venue: hydrateVenue(v) });
}));

router.patch('/venues/:id', requireAuth, ah(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v) throw boom(404, 'Venue not found');
  if (!(await isOwnerOrAdmin(v, req.user))) throw boom(403, 'Only the venue owner/manager or admin can edit');
  const b = req.body, data = {};
  ['name', 'venueType', 'indoor', 'location', 'area', 'rules', 'hours', 'openMin', 'closeMin', 'pricePerHour', 'priceUnit', 'hero', 'status', 'verified'].forEach(k => { if (b[k] !== undefined) data[k] = b[k]; });
  ['sports', 'facilities', 'gallery', 'membership', 'benefits', 'classes', 'trainers'].forEach(k => { if (b[k] !== undefined) data[k] = S(b[k]); });
  const out = await prisma.venue.update({ where: { id: v.id }, data });
  res.json({ venue: hydrateVenue(out) });
}));

// gallery management
router.post('/venues/:id/gallery', requireAuth, ah(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v || !(await isOwnerOrAdmin(v, req.user))) throw boom(403, 'Not allowed');
  const gallery = J(v.gallery, []);
  gallery.push({ url: req.body.url, caption: req.body.caption || '' });
  const out = await prisma.venue.update({ where: { id: v.id }, data: { gallery: S(gallery), hero: v.hero || req.body.url } });
  res.json({ gallery: J(out.gallery, []) });
}));
router.put('/venues/:id/gallery', requireAuth, ah(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v || !(await isOwnerOrAdmin(v, req.user))) throw boom(403, 'Not allowed');
  const out = await prisma.venue.update({ where: { id: v.id }, data: { gallery: S(req.body.gallery || []), hero: req.body.hero || v.hero } });
  res.json({ gallery: J(out.gallery, []), hero: out.hero });
}));

// reviews (lightweight)
router.post('/venues/:id/review', requireAuth, ah(async (req, res) => {
  const v = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!v) throw boom(404, 'Venue not found');
  const out = await prisma.venue.update({ where: { id: v.id }, data: { reviews: v.reviews + 1 } });
  res.json({ ok: true, reviews: out.reviews });
}));

// ── time slots ──
async function computeSlots(venue, date) {
  const [bookings, overrides] = await Promise.all([
    prisma.booking.findMany({ where: { venueId: venue.id, date, status: { notIn: ['Cancelled', 'Expired'] } } }),
    prisma.slotOverride.findMany({ where: { venueId: venue.id, date } }),
  ]);
  const bk = {}; bookings.forEach(b => { if (b.slot) bk[b.slot] = b; });
  const ov = {}; overrides.forEach(o => { ov[o.time] = o; });
  return FULL_DAY.map(t => {
    const m = timeToMin(t);
    let status = 'Available', price = venue.pricePerHour, bookingId = null;
    if (m < venue.openMin || m >= venue.closeMin) status = 'Closed';
    else if (bk[t]) { status = bk[t].paymentStatus === 'Paid' ? 'Booked' : 'Pending'; bookingId = bk[t].id; }
    else if (ov[t]) { status = ov[t].status; if (ov[t].price) price = ov[t].price; }
    return { time: t, label: `${t} - ${nextHour(t)}`, status, price, bookingId };
  });
}
router.get('/timeslots', ah(async (req, res) => {
  const { venueId, date } = req.query;
  if (!venueId) throw boom(400, 'venueId required');
  const v = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!v) throw boom(404, 'Venue not found');
  res.json({ venueId, date: date || 'Today', slots: await computeSlots(v, date || 'Today') });
}));

// admin/owner slot overrides (maintenance, closed, peak pricing)
router.post('/timeslots/override', requireAuth, ah(async (req, res) => {
  const { venueId, date, time, status, price } = req.body;
  const v = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!v || !(await isOwnerOrAdmin(v, req.user))) throw boom(403, 'Not allowed');
  const o = await prisma.slotOverride.create({ data: { venueId, date, time, status: status || 'Closed', price } });
  res.status(201).json({ override: o });
}));

// ── bookings ──
router.get('/bookings', requireAuth, ah(async (req, res) => res.json({ items: await prisma.booking.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/bookings/:id', ah(async (req, res) => { const b = await prisma.booking.findUnique({ where: { id: req.params.id } }); if (!b) throw boom(404, 'Booking not found'); res.json({ booking: b }); }));
router.get('/venues/:id/bookings', ah(async (req, res) => res.json({ items: await prisma.booking.findMany({ where: { venueId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));

const NEEDS_SLOT = bt => !['Gym Membership', 'Gym Day Pass'].includes(bt);

router.post('/bookings', requireAuth, ah(async (req, res) => {
  const b = req.body;
  const v = await prisma.venue.findUnique({ where: { id: b.venueId } });
  if (!v) throw boom(404, 'Venue not found');
  // validate slot availability
  if (b.slot && NEEDS_SLOT(b.bookingType)) {
    const slots = await computeSlots(v, b.date);
    const slot = slots.find(s => s.time === b.slot);
    if (!slot) throw boom(400, 'Invalid time slot');
    if (['Booked', 'Closed', 'Maintenance'].includes(slot.status)) throw boom(409, 'That slot is no longer available (' + slot.status + ')');
  }
  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id, venueId: b.venueId, squadId: b.squadId, sport: b.sport, date: b.date, slot: NEEDS_SLOT(b.bookingType) ? b.slot : null,
      bookingType: b.bookingType || 'Court Booking', participants: b.participants || 1, matchMode: b.matchMode, split: b.split,
      className: b.className, trainer: b.trainer, duration: b.duration || '1 hour', price: b.price || v.pricePerHour,
      status: 'Pending', paymentStatus: 'Pending', holdUntil: new Date(Date.now() + 15 * 60000),
    },
  });
  rt.emit('venue:' + v.id, 'slot:update', { venueId: v.id, date: b.date });
  res.status(201).json({ booking });
}));

// confirm/cancel/complete
router.post('/bookings/:id/cancel', requireAuth, ah(async (req, res) => {
  const b = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!b) throw boom(404, 'Booking not found');
  const out = await prisma.booking.update({ where: { id: b.id }, data: { status: 'Cancelled', paymentStatus: b.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled' } });
  rt.emit('venue:' + b.venueId, 'slot:update', { venueId: b.venueId, date: b.date });
  res.json({ booking: out });
}));
router.post('/bookings/:id/complete', requireAuth, ah(async (req, res) => res.json({ booking: await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'Completed' } }) })));
router.post('/bookings/:id/reschedule', requireAuth, ah(async (req, res) => {
  const out = await prisma.booking.update({ where: { id: req.params.id }, data: { date: req.body.date, slot: req.body.slot } });
  res.json({ booking: out });
}));

// ── memberships ──
router.get('/memberships', requireAuth, ah(async (req, res) => res.json({ items: await prisma.gymMembership.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));
router.post('/memberships', requireAuth, ah(async (req, res) => {
  const b = req.body;
  const m = await prisma.gymMembership.create({
    data: { userId: req.user.id, venueId: b.venueId, plan: b.plan, period: b.period, price: b.price, startDate: b.startDate, memberName: b.memberName || req.user.name, status: b.pay ? 'Active' : 'Pending', paymentStatus: b.pay ? 'Paid' : 'Not Started' },
  });
  notify(req.user.id, { type: b.pay ? 'payDone' : 'payPending', title: b.pay ? 'Membership active' : 'Membership pending', body: b.plan + ' membership', entityType: 'membership', entityId: m.id, route: 'profile', params: { tab: 'Memberships' } });
  res.status(201).json({ membership: m });
}));
router.post('/memberships/:id/status', requireAuth, ah(async (req, res) => res.json({ membership: await prisma.gymMembership.update({ where: { id: req.params.id }, data: { status: req.body.status } }) })));

module.exports = { router, computeSlots, hydrateVenue, FULL_DAY };
