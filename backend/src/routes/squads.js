const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate } = require('../util');
const { notify, followerCount } = require('../helpers');
const { requireAuth } = require('../auth');

async function canManage(squadId, userId) {
  const s = await prisma.squad.findUnique({ where: { id: squadId } });
  if (!s) return false;
  if (s.captainId === userId) return true;
  const m = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId, userId } } }).catch(() => null);
  return !!(m && (m.isCaptain || m.isViceCaptain));
}

// GET /api/squads
router.get('/squads', ah(async (req, res) => {
  const { skip, take, page } = paginate(req);
  const where = { status: { not: 'Deleted' } };
  if (req.query.sport && req.query.sport !== 'All') where.sport = req.query.sport;
  if (req.query.q) where.name = { contains: req.query.q };
  const [items, total] = await Promise.all([prisma.squad.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }), prisma.squad.count({ where })]);
  res.json({ items, total, page });
}));

// GET /api/squads/:id
router.get('/squads/:id', ah(async (req, res) => {
  const s = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!s) throw boom(404, 'Squad not found');
  const members = await prisma.squadMember.findMany({ where: { squadId: s.id } });
  const users = members.length ? await prisma.user.findMany({ where: { id: { in: members.map(m => m.userId) } } }) : [];
  const byId = Object.fromEntries(users.map(u => [u.id, u]));
  res.json({
    squad: { ...s, followers: await followerCount('squad', s.id, s.followersBase) },
    members: members.map(m => ({ ...m, user: byId[m.userId] ? { id: byId[m.userId].id, name: byId[m.userId].name, username: byId[m.userId].username, photo: byId[m.userId].photo } : null })),
  });
}));

// POST /api/squads
router.post('/squads', requireAuth, ah(async (req, res) => {
  const { name, sport, location, skillLevel, description, logo } = req.body;
  if (!name || !sport) throw boom(400, 'name and sport required');
  const handle = (name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'squad') + Math.floor(Math.random() * 1000);
  const squad = await prisma.squad.create({ data: { name, sport, location, skillLevel, description, logo, captainId: req.user.id } });
  await prisma.squadMember.create({ data: { squadId: squad.id, userId: req.user.id, role: 'Captain', isCaptain: true, availability: 'Available' } });
  res.status(201).json({ squad });
}));

// PATCH /api/squads/:id
router.patch('/squads/:id', requireAuth, ah(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) throw boom(403, 'Only the captain or vice-captain can edit the squad');
  const allow = ['name', 'sport', 'location', 'skillLevel', 'description', 'logo', 'banner'];
  const data = {}; allow.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const squad = await prisma.squad.update({ where: { id: req.params.id }, data });
  res.json({ squad });
}));

// GET /api/squads/:id/members
router.get('/squads/:id/members', ah(async (req, res) => res.json({ items: await prisma.squadMember.findMany({ where: { squadId: req.params.id } }) })));

// POST /api/squads/:id/invite { userId, role }
router.post('/squads/:id/invite', requireAuth, ah(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) throw boom(403, 'Only captains can invite');
  const { userId, role, sportRole } = req.body;
  const existing = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId: req.params.id, userId } } }).catch(() => null);
  if (existing) throw boom(409, 'Already a member');
  const m = await prisma.squadMember.create({ data: { squadId: req.params.id, userId, role: role || 'Player', sportRole } });
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  notify(userId, { type: 'squadInvite', title: 'Squad invite', body: 'You were added to ' + squad.name, entityType: 'squad', entityId: squad.id, route: 'squadDetail', params: { id: squad.id } });
  res.status(201).json({ member: m });
}));

// POST /api/squads/:id/join-request
router.post('/squads/:id/join-request', requireAuth, ah(async (req, res) => {
  const r = await prisma.squadJoinRequest.create({ data: { squadId: req.params.id, userId: req.user.id, message: req.body.message } });
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  notify(squad.captainId, { type: 'squadInvite', title: 'New join request', body: req.user.name + ' wants to join ' + squad.name, entityType: 'squad', entityId: squad.id });
  res.status(201).json({ request: r });
}));

router.get('/squads/:id/join-requests', requireAuth, ah(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) throw boom(403, 'Only captains can view requests');
  res.json({ items: await prisma.squadJoinRequest.findMany({ where: { squadId: req.params.id, status: 'Pending' } }) });
}));

// POST /api/squads/join-requests/:reqId/respond { accept }
router.post('/squads/join-requests/:reqId/respond', requireAuth, ah(async (req, res) => {
  const jr = await prisma.squadJoinRequest.findUnique({ where: { id: req.params.reqId } });
  if (!jr) throw boom(404, 'Request not found');
  if (!(await canManage(jr.squadId, req.user.id))) throw boom(403, 'Only captains can respond');
  const accept = !!req.body.accept;
  await prisma.squadJoinRequest.update({ where: { id: jr.id }, data: { status: accept ? 'Accepted' : 'Rejected' } });
  if (accept) {
    await prisma.squadMember.create({ data: { squadId: jr.squadId, userId: jr.userId, role: 'Player' } }).catch(() => {});
    notify(jr.userId, { type: 'accepted', title: 'Join request accepted', body: 'You joined the squad!', entityType: 'squad', entityId: jr.squadId });
  } else notify(jr.userId, { type: 'rejected', title: 'Join request declined', body: 'Your request was declined' });
  res.json({ ok: true, status: accept ? 'Accepted' : 'Rejected' });
}));

// PATCH /api/squads/:id/members/:userId  { role, sportRole, isCaptain, isViceCaptain }
router.patch('/squads/:id/members/:userId', requireAuth, ah(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) throw boom(403, 'Only captains can assign roles');
  const data = {}; ['role', 'sportRole', 'isCaptain', 'isViceCaptain', 'availability'].forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (data.isCaptain) await prisma.squad.update({ where: { id: req.params.id }, data: { captainId: req.params.userId } });
  const m = await prisma.squadMember.update({ where: { squadId_userId: { squadId: req.params.id, userId: req.params.userId } }, data });
  res.json({ member: m });
}));

// DELETE /api/squads/:id/members/:userId  (remove or leave)
router.delete('/squads/:id/members/:userId', requireAuth, ah(async (req, res) => {
  const isSelf = req.user.id === req.params.userId;
  if (!isSelf && !(await canManage(req.params.id, req.user.id))) throw boom(403, 'Not allowed');
  await prisma.squadMember.delete({ where: { squadId_userId: { squadId: req.params.id, userId: req.params.userId } } }).catch(() => {});
  res.json({ ok: true });
}));

module.exports = router;
