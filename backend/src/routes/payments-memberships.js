// Payments and Gym Memberships APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate } = require('../util');
const { requireAuth } = require('../auth');

// ──────── PAYMENTS ────────

// POST /api/payments (create payment)
router.post('/payments', requireAuth, ah(async (req, res) => {
  const { purpose, amount, refType, refId } = req.body;
  if (!purpose || !amount) throw boom(400, 'purpose and amount required');
  
  const payment = await prisma.payment.create({
    data: {
      userId: req.user.id,
      purpose,
      amount,
      refType,
      refId,
      status: 'Pending',
    },
  });
  
  res.status(201).json(payment);
}));

// GET /api/payments/:id
router.get('/payments/:id', ah(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) throw boom(404, 'Payment not found');
  res.json(payment);
}));

// PUT /api/payments/:id (confirm/mark as paid)
router.put('/payments/:id', requireAuth, ah(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment || (payment.userId !== req.user.id && req.user.role !== 'Admin')) throw boom(403, 'Not authorized');
  
  const updated = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status: req.body.status || 'Paid' },
  });
  
  // Update related booking/membership status
  if (updated.refType === 'booking' && updated.refId) {
    await prisma.booking.update({
      where: { id: updated.refId },
      data: { paymentStatus: 'Paid', status: 'Confirmed' },
    });
  } else if (updated.refType === 'membership' && updated.refId) {
    await prisma.gymMembership.update({
      where: { id: updated.refId },
      data: { paymentStatus: 'Paid', status: 'Active' },
    });
  }
  
  res.json(updated);
}));

// GET /api/users/:id/payments
router.get('/users/:id/payments', requireAuth, ah(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'Admin') throw boom(403, 'Not authorized');
  
  const { skip, take } = paginate(req);
  const payments = await prisma.payment.findMany({
    where: { userId: req.params.id },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(payments);
}));

// ──────── GYM MEMBERSHIPS ────────

// POST /api/memberships (apply)
router.post('/memberships', requireAuth, ah(async (req, res) => {
  const { venueId, plan, period, price, startDate } = req.body;
  if (!venueId || !plan || !period) throw boom(400, 'venueId, plan, period required');
  
  const membership = await prisma.gymMembership.create({
    data: {
      userId: req.user.id,
      venueId,
      plan,
      period,
      price: price || 1500,
      startDate: startDate || new Date().toISOString(),
      status: 'Pending',
      paymentStatus: 'Not Started',
    },
  });
  
  res.status(201).json(membership);
}));

// GET /api/memberships/:id
router.get('/memberships/:id', ah(async (req, res) => {
  const membership = await prisma.gymMembership.findUnique({ where: { id: req.params.id } });
  if (!membership) throw boom(404, 'Membership not found');
  res.json(membership);
}));

// PUT /api/memberships/:id (renew/modify)
router.put('/memberships/:id', requireAuth, ah(async (req, res) => {
  const membership = await prisma.gymMembership.findUnique({ where: { id: req.params.id } });
  if (!membership || membership.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.gymMembership.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      paymentStatus: req.body.paymentStatus,
    },
  });
  
  res.json(updated);
}));

// POST /api/memberships/:id/cancel
router.post('/memberships/:id/cancel', requireAuth, ah(async (req, res) => {
  const membership = await prisma.gymMembership.findUnique({ where: { id: req.params.id } });
  if (!membership || membership.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.gymMembership.update({
    where: { id: req.params.id },
    data: { status: 'Cancelled' },
  });
  
  res.json(updated);
}));

// GET /api/venues/:id/memberships (list membership plans)
router.get('/venues/:id/memberships', ah(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) throw boom(404, 'Venue not found');
  
  // Parse membership plans from venue
  const membership = JSON.parse(venue.membership || '[]');
  res.json(membership);
}));

module.exports = router;
