const router = require('express').Router();
const prisma = require('../db');
const rt = require('../realtime');
const { ah, boom, paginate } = require('../util');
const { publicUser, notify, followerCount } = require('../helpers');
const { requireAuth } = require('../auth');

// GET /api/users?q=&sport=
router.get('/users', ah(async (req, res) => {
  const { skip, take, page, limit } = paginate(req);
  const where = { status: { not: 'Deleted' } };
  if (req.query.sport && req.query.sport !== 'All') where.mainSport = req.query.sport;
  if (req.query.q) where.OR = [{ name: { contains: req.query.q } }, { username: { contains: req.query.q } }];
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);
  res.json({ items: items.map(publicUser), total, page, limit });
}));

// GET /api/users/:id
router.get('/users/:id', ah(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!u) throw boom(404, 'User not found');
  res.json({ user: publicUser(u) });
}));

// PATCH /api/users/:id  (self or admin)
router.patch('/users/:id', requireAuth, ah(async (req, res) => {
  const isSelf = req.user.id === req.params.id;
  const { ADMIN_ROLES } = require('../auth');
  if (!isSelf && !ADMIN_ROLES.includes(req.user.role)) throw boom(403, 'Cannot edit another user');
  const allow = ['name', 'username', 'photo', 'bio', 'location', 'mainSport', 'skillLevel', 'availability', 'playingStyle', 'contact'];
  const data = {}; allow.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (ADMIN_ROLES.includes(req.user.role)) { if (req.body.status) data.status = req.body.status; if (req.body.verified !== undefined) data.verified = req.body.verified; }
  const u = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json({ user: publicUser(u) });
}));

// GET /api/profiles/:id — aggregated profile with real stats
router.get('/profiles/:id', ah(async (req, res) => {
  const id = req.params.id;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw boom(404, 'User not found');
  const memberRows = await prisma.squadMember.findMany({ where: { userId: id } });
  const squadIds = memberRows.map(m => m.squadId);
  const squads = squadIds.length ? await prisma.squad.findMany({ where: { id: { in: squadIds } } }) : [];
  const [followers, following, posts, bookings, payments, memberships] = await Promise.all([
    followerCount('user', id, u.followersBase),
    prisma.follow.count({ where: { followerId: id } }).then(n => n + u.followingBase),
    prisma.post.count({ where: { createdBy: id, modStatus: 'Active' } }),
    prisma.booking.count({ where: { userId: id } }),
    prisma.payment.count({ where: { userId: id } }),
    prisma.gymMembership.count({ where: { userId: id } }),
  ]);
  const wins = squads.reduce((s, x) => s + x.wins, 0), losses = squads.reduce((s, x) => s + x.losses, 0), draws = squads.reduce((s, x) => s + x.draws, 0);
  res.json({
    user: publicUser(u),
    stats: { followers, following, squads: squads.length, wins, losses, draws, played: wins + losses + draws, rating: u.rating, bookings, payments, memberships },
  });
}));

// list helpers
router.get('/users/:id/followers', ah(async (req, res) => {
  const rows = await prisma.follow.findMany({ where: { kind: 'user', targetId: req.params.id } });
  const ids = rows.map(r => r.followerId);
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } } }) : [];
  res.json({ items: users.map(publicUser) });
}));
router.get('/users/:id/following', ah(async (req, res) => {
  const rows = await prisma.follow.findMany({ where: { followerId: req.params.id } });
  res.json({ items: rows });
}));
router.get('/users/:id/posts', ah(async (req, res) => {
  const items = await prisma.post.findMany({ where: { createdBy: req.params.id, modStatus: 'Active' }, orderBy: { createdAt: 'desc' } });
  res.json({ items });
}));
router.get('/users/:id/squads', ah(async (req, res) => {
  const m = await prisma.squadMember.findMany({ where: { userId: req.params.id } });
  const squads = m.length ? await prisma.squad.findMany({ where: { id: { in: m.map(x => x.squadId) } } }) : [];
  res.json({ items: squads });
}));
router.get('/users/:id/bookings', ah(async (req, res) => res.json({ items: await prisma.booking.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/users/:id/payments', ah(async (req, res) => res.json({ items: await prisma.payment.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/users/:id/memberships', ah(async (req, res) => res.json({ items: await prisma.gymMembership.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/me/liked', requireAuth, ah(async (req, res) => {
  const likes = await prisma.like.findMany({ where: { userId: req.user.id, targetType: 'post' } });
  const posts = likes.length ? await prisma.post.findMany({ where: { id: { in: likes.map(l => l.targetId) } } }) : [];
  res.json({ items: posts });
}));
router.get('/me/saved', requireAuth, ah(async (req, res) => {
  const saved = await prisma.savedItem.findMany({ where: { userId: req.user.id, targetType: 'post' } });
  const posts = saved.length ? await prisma.post.findMany({ where: { id: { in: saved.map(l => l.targetId) } } }) : [];
  res.json({ items: posts });
}));

// ── follows ──
// POST /api/follows  { kind, targetId }  → toggles, returns following + count
router.post('/follows', requireAuth, ah(async (req, res) => {
  const { kind, targetId } = req.body;
  if (!kind || !targetId) throw boom(400, 'kind and targetId required');
  const existing = await prisma.follow.findUnique({ where: { followerId_kind_targetId: { followerId: req.user.id, kind, targetId } } }).catch(() => null);
  let following;
  if (existing) { await prisma.follow.delete({ where: { id: existing.id } }); following = false; }
  else {
    await prisma.follow.create({ data: { followerId: req.user.id, kind, targetId } });
    following = true;
    notify(kind === 'user' ? targetId : null, { type: 'follow', title: req.user.name + ' followed you', body: 'You have a new follower', entityType: 'user', entityId: req.user.id });
  }
  const count = await prisma.follow.count({ where: { kind, targetId } });
  rt.emit('user:' + targetId, 'follow:update', { kind, targetId, count });
  res.json({ following, count });
}));

router.get('/follows/status', requireAuth, ah(async (req, res) => {
  const { kind, targetId } = req.query;
  const existing = await prisma.follow.findUnique({ where: { followerId_kind_targetId: { followerId: req.user.id, kind, targetId } } }).catch(() => null);
  res.json({ following: !!existing });
}));

module.exports = router;
