const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { notify } = require('../lib/realtime');

// GET /api/payments  (mine)
router.get('/', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.payment.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/:id', authenticate, asyncH(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) fail(404, 'Payment not found');
  res.json({ payment });
}));

// POST /api/payments  (create a payment intent — placeholder gateway)
router.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  const p = await prisma.payment.create({ data: { userId: req.user.id, purpose: b.purpose || 'Match Payment', amount: b.amount || 0, status: b.pay ? 'Paid' : 'Pending', method: b.method || 'mBoB Wallet', lobbyId: b.lobbyId, eventId: b.eventId, bookingId: b.bookingId, relatedType: b.relatedType, relatedId: b.relatedId } });
  res.status(201).json({ payment: p });
}));

router.post('/:id/pay', authenticate, asyncH(async (req, res) => {
  const p = await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'Paid', method: req.body.method || 'mBoB Wallet' } });
  notify(p.userId, { title: 'Payment completed', message: `Nu. ${p.amount} paid`, type: 'payDone', entityType: 'payment', entityId: p.id }).catch(() => {});
  res.json({ payment: p });
}));
router.post('/:id/refund', authenticate, asyncH(async (req, res) => res.json({ payment: await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'Refunded' } }) })));
router.post('/:id/dispute', authenticate, asyncH(async (req, res) => {
  await prisma.report.create({ data: { reporterId: req.user.id, type: 'Payment Dispute', targetType: 'payment', targetId: req.params.id, reason: req.body.reason || 'Payment dispute', priority: 'High' } });
  res.json({ payment: await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'Disputed' } }) });
}));

// ── Payment split / settlement ──
// GET /api/payments/lobbies/:lobbyId/split
router.get('/lobbies/:lobbyId/split', authenticate, asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.lobbyId } });
  if (!lobby) fail(404, 'Lobby not found');
  const venue = lobby.venueId ? await prisma.venue.findUnique({ where: { id: lobby.venueId } }) : null;
  const total = venue ? venue.pricePerHour : 1200;
  const split = (lobby.paymentSplit || '').includes('Host') ? { teamA: total, teamB: 0 } : { teamA: Math.round(total / 2), teamB: total - Math.round(total / 2) };
  const paid = lobby.paymentStatus === 'Paid';
  res.json({
    total, splitType: lobby.paymentSplit, teamA: split.teamA, teamB: split.teamB, perPlayer: Math.round(total / 10),
    paidAmount: paid ? total : 0, remaining: paid ? 0 : total, settlementStatus: paid ? 'Settled' : 'Balance Pending',
    teamAStatus: paid ? 'Paid' : 'Pending', teamBStatus: paid ? 'Paid' : 'Pending',
  });
}));

// POST /api/payments/lobbies/:lobbyId/settle
router.post('/lobbies/:lobbyId/settle', authenticate, asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.lobbyId } });
  if (!lobby) fail(404, 'Lobby not found');
  await prisma.matchLobby.update({ where: { id: lobby.id }, data: { paymentStatus: 'Paid' } });
  if (lobby.bookingId) await prisma.booking.update({ where: { id: lobby.bookingId }, data: { status: 'Confirmed', paymentStatus: 'Paid' } }).catch(() => {});
  const venue = lobby.venueId ? await prisma.venue.findUnique({ where: { id: lobby.venueId } }) : null;
  const p = await prisma.payment.create({ data: { userId: req.user.id, purpose: 'Match Payment', amount: venue ? venue.pricePerHour : 1200, status: 'Paid', lobbyId: lobby.id, method: 'mBoB Wallet' } });
  notify(req.user.id, { title: 'Settlement complete', message: 'Match settlement paid in full', type: 'payDone', entityType: 'lobby', entityId: lobby.id }).catch(() => {});
  res.json({ ok: true, payment: p });
}));

module.exports = router;
