// Venue and Booking Management APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, J, S } = require('../util');
const { requireAuth, requireAdmin } = require('../auth');

// ──────── VENUES ────────

// POST /api/venues (create)
router.post('/venues', requireAuth, ah(async (req, res) => {
  const { name, venueType, location, sports, facilities, pricePerHour } = req.body;
  if (!name || !venueType || !location) throw boom(400, 'name, venueType, location required');
  
  const venue = await prisma.venue.create({
    data: {
      name,
      venueType,
      location,
      ownerId: req.user.id,
      managerId: req.user.id,
      sports: S(sports || []),
      facilities: S(facilities || []),
      pricePerHour: pricePerHour || 600,
      status: 'Pending',
    },
  });
  
  res.status(201).json(venue);
}));

// GET /api/venues/:id
router.get('/venues/:id', ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) throw boom(404, 'Venue not found');
  
  const slots = await prisma.slotOverride.findMany({
    where: { venueId: venue.id },
  });
  
  res.json({
    ...venue,
    sports: J(venue.sports, []),
    facilities: J(venue.facilities, []),
    gallery: J(venue.gallery, []),
    membership: J(venue.membership, []),
    slots,
  });
}));

// PUT /api/venues/:id (edit)
router.put('/venues/:id', requireAuth, ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) throw boom(404, 'Venue not found');
  if (venue.ownerId !== req.user.id && req.user.role !== 'Admin') throw boom(403, 'Not authorized');
  
  const updated = await prisma.venue.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      sports: req.body.sports ? S(req.body.sports) : undefined,
      facilities: req.body.facilities ? S(req.body.facilities) : undefined,
      pricePerHour: req.body.pricePerHour,
      hours: req.body.hours,
      rules: req.body.rules,
    },
  });
  
  res.json(updated);
}));

// GET /api/venues (search/filter)
router.get('/venues', ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { q, sport, type, location } = req.query;
  
  const where = { status: 'Approved' };
  if (q) where.name = { contains: q };
  if (type) where.venueType = type;
  if (location) where.location = { contains: location };
  
  const venues = await prisma.venue.findMany({
    where,
    skip,
    take,
    orderBy: { followersBase: 'desc' },
  });
  
  res.json(venues.map(v => ({
    ...v,
    sports: J(v.sports, []),
    facilities: J(v.facilities, []),
  })));
}));

// POST /api/venues/:id/gallery (upload image)
router.post('/venues/:id/gallery', requireAuth, ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue || venue.ownerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const gallery = J(venue.gallery, []);
  gallery.push({ url: req.body.url, caption: req.body.caption || '' });
  
  const updated = await prisma.venue.update({
    where: { id: venue.id },
    data: { gallery: S(gallery) },
  });
  
  res.json(updated);
}));

// PUT /api/venues/:id/gallery/:imageIndex (reorder/caption)
router.put('/venues/:id/gallery/:imageIndex', requireAuth, ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue || venue.ownerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const gallery = J(venue.gallery, []);
  const idx = parseInt(req.params.imageIndex);
  if (gallery[idx]) {
    gallery[idx].caption = req.body.caption || gallery[idx].caption;
  }
  
  const updated = await prisma.venue.update({
    where: { id: venue.id },
    data: { gallery: S(gallery) },
  });
  
  res.json(updated);
}));

// DELETE /api/venues/:id/gallery/:imageIndex
router.delete('/venues/:id/gallery/:imageIndex', requireAuth, ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue || venue.ownerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const gallery = J(venue.gallery, []);
  gallery.splice(parseInt(req.params.imageIndex), 1);
  
  await prisma.venue.update({
    where: { id: venue.id },
    data: { gallery: S(gallery) },
  });
  
  res.json({ deleted: true });
}));

// POST /api/venues/:id/follow
router.post('/venues/:id/follow', requireAuth, ah(async (req, res) => {
  await prisma.follow.upsert({
    where: {
      followerId_kind_targetId: { followerId: req.user.id, kind: 'venue', targetId: req.params.id },
    },
    create: { followerId: req.user.id, kind: 'venue', targetId: req.params.id },
    update: {},
  });
  res.json({ following: true });
}));

// ──────── TIME SLOTS ────────

// GET /api/timeslots?venueId=&date=&sport=
router.get('/timeslots', ah(async (req, res) => {
  const { venueId, date, sport } = req.query;
  if (!venueId || !date) throw boom(400, 'venueId and date required');
  
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw boom(404, 'Venue not found');
  
  const overrides = await prisma.slotOverride.findMany({
    where: { venueId, date },
  });
  
  const slots = generateDaySlots(venue, overrides);
  res.json(slots);
}));

function generateDaySlots(venue, overrides) {
  const slots = [];
  const minutes = venue.openMin || 360;
  const closeMinutes = venue.closeMin || 1440;
  const duration = 60;
  
  for (let m = minutes; m < closeMinutes; m += duration) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    const override = overrides.find(o => o.time === time);
    const status = override?.status || 'Available';
    const price = override?.price || venue.pricePerHour;
    
    slots.push({ time, status, price });
  }
  
  return slots;
}

// POST /api/timeslots (create custom slot)
router.post('/timeslots', requireAuth, ah(async (req, res) => {
  const { venueId, date, time, status, price } = req.body;
  
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue || venue.ownerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const slot = await prisma.slotOverride.create({
    data: { venueId, date, time, status: status || 'Available', price },
  });
  
  res.status(201).json(slot);
}));

// ──────── BOOKINGS ────────

// POST /api/bookings (create)
router.post('/bookings', requireAuth, ah(async (req, res) => {
  const { venueId, date, slot, sport, participants, bookingType, matchMode, split } = req.body;
  if (!venueId || !date || !slot) throw boom(400, 'venueId, date, slot required');
  
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw boom(404, 'Venue not found');
  
  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id,
      venueId,
      date,
      slot,
      sport: sport || venue.sports?.[0] || 'General',
      participants: participants || 1,
      bookingType: bookingType || 'Court Booking',
      matchMode,
      split,
      price: venue.pricePerHour,
      status: 'Pending',
      holdUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  
  res.status(201).json(booking);
}));

// PUT /api/bookings/:id (confirm)
router.put('/bookings/:id', requireAuth, ah(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status || 'Confirmed',
      paymentStatus: req.body.paymentStatus,
    },
  });
  
  res.json(updated);
}));

// POST /api/bookings/:id/cancel
router.post('/bookings/:id/cancel', requireAuth, ah(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'Cancelled' },
  });
  
  res.json(updated);
}));

// GET /api/bookings/:id
router.get('/bookings/:id', ah(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw boom(404, 'Booking not found');
  res.json(booking);
}));

module.exports = router;
