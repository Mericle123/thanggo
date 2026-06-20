const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { nextHour, slotLabel } = require('../lib/slots');
const { notify, emitTo } = require('../lib/realtime');

const NEEDS_SLOT = (t) => !['Gym Membership', 'Gym Day Pass'].includes(t);

async function lockSlot(venueId, date, startTime, status, bookingId) {
  if (!startTime) return;
  await prisma.venueTimeSlot.upsert({
    where: { venueId_date_startTime: { venueId, date, startTime } },
    update: { status, bookingId, holdExpiresAt: null },
    create: { venueId, date, startTime, endTime: nextHour(startTime), status, bookingId },
  });
  emitTo('venue:' + venueId, 'slot:update', { date, startTime, status });
}
async function freeSlot(venueId, date, startTime) {
  if (!startTime) return;
  await prisma.venueTimeSlot.deleteMany({ where: { venueId, date, startTime } });
  emitTo('venue:' + venueId, 'slot:update', { date, startTime, status: 'Available' });
}

// POST /api/bookings
router.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  const venue = await prisma.venue.findUnique({ where: { id: b.venueId } });
  if (!venue) fail(404, 'Venue not found');
  const needsSlot = NEEDS_SLOT(b.bookingType) && b.bookingType !== 'Class Booking';
  if (needsSlot && b.slotStart) {
    const slot = await prisma.venueTimeSlot.findUnique({ where: { venueId_date_startTime: { venueId: b.venueId, date: b.date, startTime: b.slotStart } } });
    if (slot && ['Booked', 'Closed', 'Maintenance'].includes(slot.status)) fail(409, 'That time slot is no longer available');
  }
  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id, squadId: b.squadId || null, venueId: b.venueId, sport: b.sport || null,
      date: b.date || 'Today', slotStart: needsSlot ? (b.slotStart || null) : null, bookingType: b.bookingType || 'Solo Booking',
      participants: b.participants || 1, matchMode: b.matchMode || null, split: b.split || null,
      price: b.price != null ? b.price : venue.pricePerHour, duration: b.duration || '1 hour',
      className: b.className || null, trainer: b.trainer || null, status: 'Pending', paymentStatus: 'Pending',
    },
  });
  if (needsSlot && booking.slotStart) await lockSlot(b.venueId, booking.date, booking.slotStart, 'Pending', booking.id);
  await prisma.payment.create({ data: { userId: req.user.id, purpose: 'Venue Booking', amount: booking.price, status: 'Pending', bookingId: booking.id } }).catch(() => {});
  notify(req.user.id, { title: 'Booking created', message: `${venue.name} · ${booking.date}${booking.slotStart ? ' · ' + slotLabel(booking.slotStart) : ''}`, type: 'booking', entityType: 'booking', entityId: booking.id }).catch(() => {});
  res.status(201).json({ booking });
}));

// GET /api/bookings  (mine)
router.get('/', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.booking.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));
// GET /api/bookings/:id
router.get('/:id', authenticate, asyncH(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) fail(404, 'Booking not found');
  const venue = await prisma.venue.findUnique({ where: { id: booking.venueId } });
  res.json({ booking, venue });
}));

// POST /api/bookings/:id/pay
router.post('/:id/pay', authenticate, asyncH(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) fail(404, 'Booking not found');
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'Confirmed', paymentStatus: 'Paid' } });
  await prisma.payment.updateMany({ where: { bookingId: booking.id }, data: { status: 'Paid', method: req.body.method || 'mBoB Wallet' } });
  if (booking.slotStart) await lockSlot(booking.venueId, booking.date, booking.slotStart, 'Booked', booking.id);
  notify(req.user.id, { title: 'Payment completed', message: 'Your booking is paid & confirmed.', type: 'payDone', entityType: 'booking', entityId: booking.id }).catch(() => {});
  res.json({ booking: updated });
}));

// POST /api/bookings/:id/cancel  (frees the slot)
router.post('/:id/cancel', authenticate, asyncH(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) fail(404, 'Booking not found');
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'Cancelled', paymentStatus: booking.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled' } });
  if (booking.slotStart) await freeSlot(booking.venueId, booking.date, booking.slotStart);
  notify(req.user.id, { title: 'Booking cancelled', message: 'Your booking was cancelled and the slot released.', type: 'rejected', entityType: 'booking', entityId: booking.id }).catch(() => {});
  res.json({ booking: updated });
}));

// POST /api/bookings/:id/complete
router.post('/:id/complete', authenticate, asyncH(async (req, res) => {
  res.json({ booking: await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'Completed' } }) });
}));

// POST /api/bookings/:id/create-challenge  (Find Opponent → Match Challenge post)
router.post('/:id/create-challenge', authenticate, asyncH(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) fail(404, 'Booking not found');
  const venue = await prisma.venue.findUnique({ where: { id: booking.venueId } });
  const member = await prisma.squadMember.findFirst({ where: { userId: req.user.id } });
  const squad = member ? await prisma.squad.findUnique({ where: { id: member.squadId } }) : null;
  const post = await prisma.post.create({
    data: {
      authorId: squad ? squad.id : req.user.id, authorType: squad ? 'squad' : 'user', squadId: squad ? squad.id : null,
      postType: 'Match Challenge', title: `${booking.sport || 'Match'} challenge at ${venue.name.split(' ')[0]}`,
      caption: `Booked ${venue.name} ${booking.date}${booking.slotStart ? ' ' + slotLabel(booking.slotStart) : ''}. Looking for an opponent. ${booking.split || '50/50 Team Split'}.`,
      sport: booking.sport, status: 'Looking for Opponent', teamSize: '5v5', preferredTime: booking.date, venueId: booking.venueId, venueName: venue.name,
      paymentSplit: booking.split || '50/50 Team Split', expiry: '3h 00m', bookingId: booking.id,
    },
  });
  await prisma.booking.update({ where: { id: booking.id }, data: { postId: post.id } });
  res.status(201).json({ post });
}));

// ── Gym memberships ──
router.post('/memberships', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  const m = await prisma.gymMembership.create({
    data: {
      userId: req.user.id, venueId: b.venueId, plan: b.plan, period: b.period, price: b.price || 0,
      startDate: b.startDate || 'Today', memberName: b.memberName || req.user.profile?.name,
      status: b.pay ? 'Active' : 'Pending', paymentStatus: b.pay ? 'Paid' : 'Not Started',
    },
  });
  if (b.pay) await prisma.payment.create({ data: { userId: req.user.id, purpose: 'Gym Membership', amount: m.price, status: 'Paid', membershipId: m.id, method: 'mBoB Wallet' } }).catch(() => {});
  notify(req.user.id, { title: b.pay ? 'Membership active' : 'Membership pending', message: `${b.plan} membership`, type: b.pay ? 'payDone' : 'payPending', entityType: 'membership', entityId: m.id }).catch(() => {});
  res.status(201).json({ membership: m });
}));
router.get('/memberships/mine', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.gymMembership.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));
router.post('/memberships/:id/activate', authenticate, asyncH(async (req, res) => {
  res.json({ membership: await prisma.gymMembership.update({ where: { id: req.params.id }, data: { status: 'Active', paymentStatus: 'Paid' } }) });
}));

module.exports = router;
