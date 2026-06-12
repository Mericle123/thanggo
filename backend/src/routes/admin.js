// Notifications, Reports, Support, and Admin APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate } = require('../util');
const { requireAuth, requireAdmin } = require('../auth');

// ──────── NOTIFICATIONS ────────

// GET /api/notifications
router.get('/notifications', requireAuth, ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(notifications);
}));

// PUT /api/notifications/:id (mark as read)
router.put('/notifications/:id', requireAuth, ah(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  
  res.json(updated);
}));

// POST /api/notifications/mark-all-read
router.post('/notifications/mark-all-read', requireAuth, ah(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  
  res.json({ marked: true });
}));

// DELETE /api/notifications/:id
router.delete('/notifications/:id', requireAuth, ah(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
}));

// ──────── REPORTS ────────

// POST /api/reports (create report)
router.post('/reports', requireAuth, ah(async (req, res) => {
  const { type, targetId, reason } = req.body;
  if (!type || !targetId || !reason) throw boom(400, 'type, targetId, reason required');
  
  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      type,
      targetId,
      reason,
      priority: 'Medium',
      status: 'Open',
    },
  });
  
  res.status(201).json(report);
}));

// GET /api/reports (admin only)
router.get('/reports', requireAdmin, ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { status } = req.query;
  
  const where = {};
  if (status) where.status = status;
  
  const reports = await prisma.report.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(reports);
}));

// PUT /api/reports/:id (admin only)
router.put('/reports/:id', requireAdmin, ah(async (req, res) => {
  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
    },
  });
  
  res.json(updated);
}));

// ──────── SUPPORT TICKETS ────────

// POST /api/tickets (create)
router.post('/tickets', requireAuth, ah(async (req, res) => {
  const { subject, category, priority } = req.body;
  if (!subject) throw boom(400, 'subject required');
  
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      subject,
      category: category || 'Other',
      priority: priority || 'Medium',
      status: 'Open',
    },
  });
  
  res.status(201).json(ticket);
}));

// GET /api/tickets
router.get('/tickets', requireAuth, ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const where = { userId: req.user.id };
  
  const tickets = await prisma.supportTicket.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(tickets);
}));

// GET /api/tickets/:id/messages
router.get('/tickets/:id/messages', requireAuth, ah(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket || (ticket.userId !== req.user.id && req.user.role !== 'Admin')) throw boom(403, 'Not authorized');
  
  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  
  res.json(messages);
}));

// POST /api/tickets/:id/messages (reply)
router.post('/tickets/:id/messages', requireAuth, ah(async (req, res) => {
  const { text } = req.body;
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket || (ticket.userId !== req.user.id && req.user.role !== 'Admin')) throw boom(403, 'Not authorized');
  
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: req.params.id,
      userId: req.user.id,
      text,
    },
  });
  
  res.status(201).json(message);
}));

// ──────── ADMIN DASHBOARD ────────

// GET /api/admin/dashboard
router.get('/admin/dashboard', requireAdmin, ah(async (req, res) => {
  const [users, venues, bookings, payments, events, reports] = await Promise.all([
    prisma.user.count(),
    prisma.venue.count(),
    prisma.booking.count({ where: { status: 'Confirmed' } }),
    prisma.payment.count({ where: { status: 'Paid' } }),
    prisma.event.count(),
    prisma.report.count({ where: { status: 'Open' } }),
  ]);
  
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'Paid' },
  });
  
  res.json({
    users,
    venues,
    bookings,
    payments,
    revenue: totalRevenue._sum.amount || 0,
    events,
    openReports: reports,
  });
}));

// ──────── ADMIN USER MANAGEMENT ────────

// PUT /api/admin/users/:id (suspend/ban)
router.put('/admin/users/:id', requireAdmin, ah(async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      verified: req.body.verified,
    },
  });
  
  await prisma.adminActivityLog.create({
    data: {
      adminId: req.user.id,
      adminRole: req.user.role,
      action: `Updated user ${req.params.id}`,
      target: 'User',
      detail: JSON.stringify(req.body),
    },
  });
  
  res.json(updated);
}));

// ──────── ADMIN VENUE MANAGEMENT ────────

// PUT /api/admin/venues/:id/approve
router.put('/admin/venues/:id/approve', requireAdmin, ah(async (req, res) => {
  const updated = await prisma.venue.update({
    where: { id: req.params.id },
    data: { status: 'Approved', verified: true },
  });
  
  await prisma.adminActivityLog.create({
    data: {
      adminId: req.user.id,
      adminRole: req.user.role,
      action: `Approved venue ${req.params.id}`,
      target: 'Venue',
    },
  });
  
  res.json(updated);
}));

// ──────── ADMIN EVENT MANAGEMENT ────────

// GET /api/admin/events/:id/registrations
router.get('/admin/events/:id/registrations', requireAdmin, ah(async (req, res) => {
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: req.params.id },
  });
  res.json(registrations);
}));

// PUT /api/admin/events/:id/registrations/:regId
router.put('/admin/events/:id/registrations/:regId', requireAdmin, ah(async (req, res) => {
  const updated = await prisma.eventRegistration.update({
    where: { id: req.params.regId },
    data: { status: req.body.status },
  });
  
  res.json(updated);
}));

// ──────── ADMIN ACTIVITY LOG ────────

// GET /api/admin/logs
router.get('/admin/logs', requireAdmin, ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const logs = await prisma.adminActivityLog.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
}));

// ──────── ADMIN POSTS/COMMENTS MODERATION ────────

// PUT /api/admin/posts/:id/moderate
router.put('/admin/posts/:id/moderate', requireAdmin, ah(async (req, res) => {
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { modStatus: req.body.status },
  });
  
  await prisma.adminActivityLog.create({
    data: {
      adminId: req.user.id,
      adminRole: req.user.role,
      action: `Moderated post ${req.params.id}`,
      target: 'Post',
      detail: req.body.status,
    },
  });
  
  res.json(updated);
}));

module.exports = router;
