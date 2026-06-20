const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate, requireAdmin, requireSection } = require('../middleware/auth');
const { notify } = require('../lib/realtime');

router.use(authenticate, requireAdmin);

const log = (req, action, targetType, targetId, detail) =>
  prisma.adminActivityLog.create({ data: { adminId: req.user.id, adminRole: req.user.role, action, targetType: targetType || null, targetId: targetId || null, detail: detail || null } });

// GET /api/admin/dashboard
router.get('/dashboard', asyncH(async (req, res) => {
  const [users, activeUsers, squads, venues, bookings, todays, pendingBookings, events, revenueAgg, pendingPay, reportedPosts, openTickets, venueApps, memberApps] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { status: 'Active' } }), prisma.squad.count(), prisma.venue.count(),
    prisma.booking.count(), prisma.booking.count({ where: { date: 'Today' } }), prisma.booking.count({ where: { status: 'Pending' } }),
    prisma.event.count(), prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }),
    prisma.payment.count({ where: { status: { in: ['Pending', 'Not Started', 'Partially Paid'] } } }),
    prisma.report.count({ where: { type: 'Post Report' } }), prisma.supportTicket.count({ where: { status: 'Open' } }),
    prisma.venue.count({ where: { status: 'Pending' } }), prisma.gymMembership.count({ where: { status: 'Pending' } }),
  ]);
  res.json({
    totalUsers: users, activeUsers, totalSquads: squads, totalVenues: venues, totalBookings: bookings, todaysBookings: todays,
    pendingBookings, totalEvents: events, totalRevenue: revenueAgg._sum.amount || 0, pendingPayments: pendingPay,
    reportedPosts, openTickets, venueApplications: venueApps, membershipApplications: memberApps,
  });
}));

// Users
router.get('/users', requireSection('users'), asyncH(async (req, res) => res.json({ items: await prisma.profile.findMany({ include: { user: { select: { id: true, email: true, role: true, status: true, verified: true } } }, take: 200 }) })));
router.post('/users/:id/status', requireSection('users'), asyncH(async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  await log(req, req.body.status + ' user', 'user', u.id);
  notify(u.id, { title: 'Account ' + req.body.status, type: 'system' }).catch(() => {});
  res.json({ user: { id: u.id, status: u.status } });
}));
router.post('/users/:id/verify', requireSection('users'), asyncH(async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { verified: true } });
  await log(req, 'Verified user', 'user', u.id);
  res.json({ ok: true });
}));

// Venues + applications
router.get('/venues', requireSection('venues'), asyncH(async (req, res) => res.json({ items: await prisma.venue.findMany({ take: 200 }) })));
router.get('/venue-applications', requireSection('venues'), asyncH(async (req, res) => res.json({ items: await prisma.venue.findMany({ where: { status: 'Pending' } }) })));
router.post('/venues/:id/status', requireSection('venues'), asyncH(async (req, res) => {
  const v = await prisma.venue.update({ where: { id: req.params.id }, data: { status: req.body.status, verified: req.body.status === 'Approved' } });
  await log(req, req.body.status + ' venue', 'venue', v.id, v.name);
  res.json({ venue: { id: v.id, status: v.status } });
}));

// Squads
router.get('/squads', requireSection('squads'), asyncH(async (req, res) => res.json({ items: await prisma.squad.findMany({ take: 200 }) })));
router.post('/squads/:id/status', requireSection('squads'), asyncH(async (req, res) => {
  const s = await prisma.squad.update({ where: { id: req.params.id }, data: { status: req.body.status, verified: req.body.status === 'Verified' } });
  await log(req, req.body.status + ' squad', 'squad', s.id, s.name);
  res.json({ squad: { id: s.id, status: s.status } });
}));

// Bookings
router.get('/bookings', requireSection('bookings'), asyncH(async (req, res) => res.json({ items: await prisma.booking.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/bookings/:id/:action', requireSection('bookings'), asyncH(async (req, res) => {
  const map = { cancel: 'Cancelled', complete: 'Completed', confirm: 'Confirmed' };
  const b = await prisma.booking.update({ where: { id: req.params.id }, data: { status: map[req.params.action] || 'Pending' } });
  await log(req, req.params.action + ' booking', 'booking', b.id);
  res.json({ booking: { id: b.id, status: b.status } });
}));

// Posts / comments moderation
router.get('/posts', requireSection('posts'), asyncH(async (req, res) => res.json({ items: await prisma.post.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/posts/:id/mod', requireSection('posts'), asyncH(async (req, res) => {
  const p = await prisma.post.update({ where: { id: req.params.id }, data: { modStatus: req.body.mod } });
  await log(req, req.body.mod + ' post', 'post', p.id);
  res.json({ post: { id: p.id, modStatus: p.modStatus } });
}));
router.delete('/posts/:id', requireSection('posts'), asyncH(async (req, res) => { await prisma.post.delete({ where: { id: req.params.id } }).catch(() => {}); await log(req, 'Removed post', 'post', req.params.id); res.json({ ok: true }); }));
router.get('/comments', requireSection('comments'), asyncH(async (req, res) => res.json({ items: await prisma.comment.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));

// Payments
router.get('/payments', requireSection('payments'), asyncH(async (req, res) => res.json({ items: await prisma.payment.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/payments/:id/refund', requireSection('payments'), asyncH(async (req, res) => { const p = await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'Refunded' } }); await log(req, 'Refunded payment', 'payment', p.id, 'Nu. ' + p.amount); res.json({ payment: { id: p.id, status: p.status } }); }));
router.post('/payments/:id/mark-paid', requireSection('payments'), asyncH(async (req, res) => { const p = await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'Paid' } }); await log(req, 'Marked payment paid', 'payment', p.id); res.json({ payment: { id: p.id, status: p.status } }); }));

// Memberships
router.get('/memberships', requireSection('memberships'), asyncH(async (req, res) => res.json({ items: await prisma.gymMembership.findMany({ take: 200 }) })));
router.post('/memberships/:id/status', requireSection('memberships'), asyncH(async (req, res) => { const m = await prisma.gymMembership.update({ where: { id: req.params.id }, data: { status: req.body.status } }); await log(req, 'Membership ' + req.body.status, 'membership', m.id); res.json({ membership: { id: m.id, status: m.status } }); }));

// Reports / support
router.get('/reports', requireSection('reports'), asyncH(async (req, res) => res.json({ items: await prisma.report.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/reports/:id/status', requireSection('reports'), asyncH(async (req, res) => { const r = await prisma.report.update({ where: { id: req.params.id }, data: { status: req.body.status } }); await log(req, 'Report ' + req.body.status, 'report', r.id); res.json({ report: { id: r.id, status: r.status } }); }));
router.get('/tickets', requireSection('support'), asyncH(async (req, res) => res.json({ items: await prisma.supportTicket.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/tickets/:id', requireSection('support'), asyncH(async (req, res) => { const t = await prisma.supportTicket.update({ where: { id: req.params.id }, data: req.body }); await log(req, 'Updated ticket', 'ticket', t.id); res.json({ ticket: t }); }));

// Lobbies
router.get('/lobbies', requireSection('lobbies'), asyncH(async (req, res) => res.json({ items: await prisma.matchLobby.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));
router.post('/lobbies/:id/:action', requireSection('lobbies'), asyncH(async (req, res) => {
  const map = { cancel: 'Cancelled', resolve: 'Completed', complete: 'Completed' };
  const l = await prisma.matchLobby.update({ where: { id: req.params.id }, data: { status: map[req.params.action] || 'Cancelled' } });
  await log(req, req.params.action + ' lobby', 'lobby', l.id);
  res.json({ lobby: { id: l.id, status: l.status } });
}));

// Announcements → broadcast notifications + log
router.post('/announcements', requireSection('announcements'), asyncH(async (req, res) => {
  const { title, message, audience, category } = req.body;
  if (!title) fail(400, 'title required');
  let users = [];
  if (audience === 'All users' || !audience) users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(users.map((u) => notify(u.id, { title, message: message || null, type: 'system' }).catch(() => {})));
  await log(req, 'Sent announcement', 'announcement', null, title + ' → ' + (audience || 'All users'));
  res.status(201).json({ ok: true, sentTo: users.length });
}));

// Activity logs
router.get('/logs', asyncH(async (req, res) => res.json({ items: await prisma.adminActivityLog.findMany({ take: 200, orderBy: { createdAt: 'desc' } }) })));

// Analytics
router.get('/analytics', requireSection('analytics'), asyncH(async (req, res) => {
  const bookings = await prisma.booking.findMany({ select: { sport: true } });
  const sportCounts = {}; bookings.forEach((b) => { if (b.sport) sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1; });
  const [paid, total] = await Promise.all([prisma.payment.count({ where: { status: 'Paid' } }), prisma.payment.count()]);
  res.json({
    users: await prisma.user.count(),
    revenue: (await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }))._sum.amount || 0,
    mostBookedSports: Object.entries(sportCounts).map(([k, v]) => ({ sport: k, count: v })),
    paymentSuccessRate: total ? Math.round((paid / total) * 100) : 0,
    activeSquads: await prisma.squad.count({ where: { status: { in: ['Active', 'Verified'] } } }),
    eventRegistrations: await prisma.eventRegistration.count(),
  });
}));

module.exports = router;
