const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { asyncH, fail, pageArgs } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { notify } = require('../lib/realtime');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) || 'squad';
async function canManage(squadId, userId) {
  const s = await prisma.squad.findUnique({ where: { id: squadId } });
  if (!s) return false;
  if (s.captainId === userId) return true;
  const m = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId, userId } } });
  return !!(m && (m.isCaptain || m.isViceCaptain));
}

// GET /api/squads
router.get('/', asyncH(async (req, res) => {
  const { skip, take, page } = pageArgs(req);
  const q = (req.query.q || '').toString(); const sport = req.query.sport;
  const where = { AND: [q ? { name: { contains: q } } : {}, sport && sport !== 'All' ? { sport } : {}] };
  const [items, total] = await Promise.all([
    prisma.squad.findMany({ where, skip, take, include: { _count: { select: { members: true } } }, orderBy: { followers: 'desc' } }),
    prisma.squad.count({ where }),
  ]);
  res.json({ items, total, page });
}));

// POST /api/squads
router.post('/', authenticate, asyncH(async (req, res) => {
  const { name, sport, location, skillLevel, description } = req.body;
  if (!name || !sport) fail(400, 'name and sport are required');
  let handle = slug(name); let n = 0;
  while (await prisma.squad.findUnique({ where: { handle } })) { n++; handle = slug(name) + n; }
  const squad = await prisma.squad.create({
    data: {
      name, handle, sport, location, skillLevel, description, captainId: req.user.id,
      members: { create: { userId: req.user.id, role: 'Captain', isCaptain: true, availability: 'Available' } },
    },
    include: { members: true },
  });
  res.status(201).json({ squad });
}));

// GET /api/squads/:id
router.get('/:id', asyncH(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id }, include: { members: true } });
  if (!squad) fail(404, 'Squad not found');
  const profiles = await prisma.profile.findMany({ where: { userId: { in: squad.members.map((m) => m.userId) } } });
  const pmap = Object.fromEntries(profiles.map((p) => [p.userId, p]));
  res.json({ squad: { ...squad, members: squad.members.map((m) => ({ ...m, profile: pmap[m.userId] || null })) } });
}));

// PUT /api/squads/:id  (captain/VC)
router.put('/:id', authenticate, asyncH(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) fail(403, 'Only the captain or vice-captain can edit this squad');
  const allowed = ['name', 'location', 'skillLevel', 'description', 'logo', 'banner', 'sport'];
  const data = {}; allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  res.json({ squad: await prisma.squad.update({ where: { id: req.params.id }, data }) });
}));

// POST /api/squads/:id/join-request
router.post('/:id/join-request', authenticate, asyncH(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) fail(404, 'Squad not found');
  const r = await prisma.squadJoinRequest.create({ data: { squadId: req.params.id, userId: req.user.id, message: req.body.message || null } });
  notify(squad.captainId, { title: 'New join request', message: (req.user.profile?.name || 'A player') + ' wants to join ' + squad.name, type: 'squadInvite', entityType: 'squad', entityId: squad.id }).catch(() => {});
  res.status(201).json({ request: r });
}));

// GET /api/squads/:id/join-requests  (captain/VC)
router.get('/:id/join-requests', authenticate, asyncH(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) fail(403, 'Captain only');
  res.json({ items: await prisma.squadJoinRequest.findMany({ where: { squadId: req.params.id, status: 'Pending' } }) });
}));

// POST /api/squads/join-requests/:reqId/:action  accept|reject  (captain/VC)
router.post('/join-requests/:reqId/:action', authenticate, asyncH(async (req, res) => {
  const reqRow = await prisma.squadJoinRequest.findUnique({ where: { id: req.params.reqId } });
  if (!reqRow) fail(404, 'Request not found');
  if (!(await canManage(reqRow.squadId, req.user.id))) fail(403, 'Captain only');
  const accept = req.params.action === 'accept';
  await prisma.squadJoinRequest.update({ where: { id: reqRow.id }, data: { status: accept ? 'Accepted' : 'Rejected' } });
  if (accept) {
    await prisma.squadMember.upsert({
      where: { squadId_userId: { squadId: reqRow.squadId, userId: reqRow.userId } },
      update: {}, create: { squadId: reqRow.squadId, userId: reqRow.userId, role: 'Player', availability: 'Available' },
    });
  }
  notify(reqRow.userId, { title: accept ? 'Join request accepted' : 'Join request declined', type: accept ? 'accepted' : 'rejected', entityType: 'squad', entityId: reqRow.squadId }).catch(() => {});
  res.json({ ok: true, status: accept ? 'Accepted' : 'Rejected' });
}));

// POST /api/squads/:id/members  (invite/add, captain)
router.post('/:id/members', authenticate, asyncH(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) fail(403, 'Captain only');
  const { userId, role, sportRole } = req.body;
  const member = await prisma.squadMember.upsert({
    where: { squadId_userId: { squadId: req.params.id, userId } },
    update: { role: role || undefined, sportRole: sportRole || undefined },
    create: { squadId: req.params.id, userId, role: role || 'Player', sportRole },
  });
  notify(userId, { title: 'Squad invite', message: 'You were added to a squad', type: 'squadInvite', entityType: 'squad', entityId: req.params.id }).catch(() => {});
  res.json({ member });
}));

// PUT /api/squads/:id/members/:userId/role  (assign role, captain)
router.put('/:id/members/:userId/role', authenticate, asyncH(async (req, res) => {
  if (!(await canManage(req.params.id, req.user.id))) fail(403, 'Captain only');
  const { role, sportRole, isCaptain, isViceCaptain } = req.body;
  const data = {};
  if (role !== undefined) data.role = role;
  if (sportRole !== undefined) data.sportRole = sportRole;
  if (isViceCaptain !== undefined) data.isViceCaptain = !!isViceCaptain;
  if (isCaptain) { data.isCaptain = true; await prisma.squad.update({ where: { id: req.params.id }, data: { captainId: req.params.userId } }); }
  const member = await prisma.squadMember.update({ where: { squadId_userId: { squadId: req.params.id, userId: req.params.userId } }, data });
  res.json({ member });
}));

// DELETE /api/squads/:id/members/:userId  (remove / leave)
router.delete('/:id/members/:userId', authenticate, asyncH(async (req, res) => {
  const self = req.params.userId === req.user.id;
  if (!self && !(await canManage(req.params.id, req.user.id))) fail(403, 'Captain only');
  await prisma.squadMember.delete({ where: { squadId_userId: { squadId: req.params.id, userId: req.params.userId } } }).catch(() => {});
  res.json({ ok: true });
}));

router.get('/:id/members', asyncH(async (req, res) => res.json({ items: await prisma.squadMember.findMany({ where: { squadId: req.params.id } }) })));
router.get('/:id/posts', asyncH(async (req, res) => res.json({ items: await prisma.post.findMany({ where: { squadId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));

module.exports = router;
