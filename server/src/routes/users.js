const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail, pageArgs } = require('../lib/util');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { notify } = require('../lib/realtime');

// Build real profile stats from data.
async function stats(userId) {
  const [memberRows, posts, bookings, payments, memberships] = await Promise.all([
    prisma.squadMember.findMany({ where: { userId } }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.booking.count({ where: { userId } }),
    prisma.payment.count({ where: { userId } }),
    prisma.gymMembership.count({ where: { userId } }),
  ]);
  const squadIds = memberRows.map((m) => m.squadId);
  const squads = squadIds.length ? await prisma.squad.findMany({ where: { id: { in: squadIds } } }) : [];
  const wins = squads.reduce((s, x) => s + x.wins, 0), losses = squads.reduce((s, x) => s + x.losses, 0), draws = squads.reduce((s, x) => s + x.draws, 0);
  return { squads: squads.length, posts, bookings, payments, memberships, wins, losses, draws, matchesPlayed: wins + losses + draws };
}

// GET /api/users  (search players)
router.get('/', optionalAuth, asyncH(async (req, res) => {
  const { skip, take, page } = pageArgs(req);
  const q = (req.query.q || '').toString();
  const sport = req.query.sport;
  const where = {
    AND: [
      q ? { OR: [{ name: { contains: q } }, { username: { contains: q } }] } : {},
      sport && sport !== 'All' ? { mainSport: sport } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.profile.findMany({ where, skip, take, orderBy: { followers: 'desc' } }),
    prisma.profile.count({ where }),
  ]);
  res.json({ items, total, page });
}));

// GET /api/users/:id  (profile)
router.get('/:id', asyncH(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } });
  if (!user) fail(404, 'User not found');
  res.json({ user: { id: user.id, role: user.role, status: user.status }, profile: user.profile, stats: await stats(user.id) });
}));

// PUT /api/users/me  (edit own profile)
router.put('/me/profile', authenticate, asyncH(async (req, res) => {
  const allowed = ['name', 'photo', 'location', 'mainSport', 'skillLevel', 'availability', 'playingStyle', 'bio', 'contact'];
  const data = {}; allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const profile = await prisma.profile.update({ where: { userId: req.user.id }, data });
  res.json({ profile });
}));

// GET /api/users/:id/stats
router.get('/:id/stats', asyncH(async (req, res) => res.json(await stats(req.params.id))));

// GET /api/users/:id/posts | /liked | /saved | /bookings | /payments | /memberships | /squads
router.get('/:id/posts', asyncH(async (req, res) => res.json({ items: await prisma.post.findMany({ where: { authorId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/:id/liked', asyncH(async (req, res) => {
  const likes = await prisma.like.findMany({ where: { userId: req.params.id, targetType: 'post' } });
  const items = await prisma.post.findMany({ where: { id: { in: likes.map((l) => l.targetId) } } });
  res.json({ items });
}));
router.get('/:id/saved', asyncH(async (req, res) => {
  const saved = await prisma.savedItem.findMany({ where: { userId: req.params.id, targetType: 'post' } });
  const items = await prisma.post.findMany({ where: { id: { in: saved.map((l) => l.targetId) } } });
  res.json({ items });
}));
router.get('/:id/bookings', asyncH(async (req, res) => res.json({ items: await prisma.booking.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/:id/payments', asyncH(async (req, res) => res.json({ items: await prisma.payment.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/:id/memberships', asyncH(async (req, res) => res.json({ items: await prisma.gymMembership.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));
router.get('/:id/squads', asyncH(async (req, res) => {
  const members = await prisma.squadMember.findMany({ where: { userId: req.params.id } });
  res.json({ items: await prisma.squad.findMany({ where: { id: { in: members.map((m) => m.squadId) } } }) });
}));

// ── Follows ──
// POST /api/users/follow  { targetType, targetId }
router.post('/follow', authenticate, asyncH(async (req, res) => {
  const { targetType, targetId } = req.body;
  if (!['user', 'squad', 'venue', 'event'].includes(targetType)) fail(400, 'Invalid targetType');
  const key = { followerId: req.user.id, targetType, targetId };
  const existing = await prisma.follow.findUnique({ where: { followerId_targetType_targetId: key } });
  let following;
  if (existing) { await prisma.follow.delete({ where: { id: existing.id } }); following = false; }
  else { await prisma.follow.create({ data: key }); following = true; }
  // keep counts in sync
  if (targetType === 'user') await prisma.profile.update({ where: { userId: targetId }, data: { followers: { increment: following ? 1 : -1 } } }).catch(() => {});
  if (targetType === 'squad') await prisma.squad.update({ where: { id: targetId }, data: { followers: { increment: following ? 1 : -1 } } }).catch(() => {});
  if (targetType === 'venue') await prisma.venue.update({ where: { id: targetId }, data: {} }).catch(() => {});
  await prisma.profile.update({ where: { userId: req.user.id }, data: { following: { increment: following ? 1 : -1 } } }).catch(() => {});
  if (following && targetType === 'user') notify(targetId, { title: 'New follower', message: (req.user.profile?.name || 'Someone') + ' followed you', type: 'follow', entityType: 'user', entityId: req.user.id }).catch(() => {});
  const count = await prisma.follow.count({ where: { targetType, targetId } });
  res.json({ following, followers: count });
}));

// GET /api/users/:id/followers
router.get('/:id/followers', asyncH(async (req, res) => {
  const follows = await prisma.follow.findMany({ where: { targetType: 'user', targetId: req.params.id }, take: 100 });
  const profiles = await prisma.profile.findMany({ where: { userId: { in: follows.map((f) => f.followerId) } } });
  res.json({ items: profiles, total: await prisma.follow.count({ where: { targetType: 'user', targetId: req.params.id } }) });
}));
// GET /api/users/:id/following
router.get('/:id/following', asyncH(async (req, res) => {
  const follows = await prisma.follow.findMany({ where: { followerId: req.params.id }, take: 200 });
  res.json({ items: follows, total: follows.length });
}));

module.exports = router;
