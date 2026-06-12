// Squads management APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, formatSquad } = require('../util');
const { requireAuth } = require('../auth');

// POST /api/squads (create)
router.post('/squads', requireAuth, ah(async (req, res) => {
  const { name, sport, handle, location, skillLevel, description } = req.body;
  if (!name || !sport) throw boom(400, 'name and sport required');
  
  const squad = await prisma.squad.create({
    data: {
      name,
      sport,
      handle: handle || name.toLowerCase().replace(/\s+/g, '-'),
      location,
      skillLevel,
      description,
      captainId: req.user.id,
    },
  });
  
  // Add creator as captain
  await prisma.squadMember.create({
    data: { squadId: squad.id, userId: req.user.id, role: 'Captain', isCaptain: true },
  });
  
  res.status(201).json(formatSquad(squad));
}));

// GET /api/squads/:id
router.get('/squads/:id', ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const members = await prisma.squadMember.findMany({
    where: { squadId: squad.id },
    include: { user: true },
  });
  
  res.json({
    squad: formatSquad(squad),
    members,
    memberCount: members.length,
  });
}));

// PUT /api/squads/:id (edit - captain only)
router.put('/squads/:id', requireAuth, ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain) throw boom(403, 'Only captain can edit squad');
  
  const updated = await prisma.squad.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name || squad.name,
      description: req.body.description,
      skillLevel: req.body.skillLevel,
      location: req.body.location,
      logo: req.body.logo,
      banner: req.body.banner,
    },
  });
  
  res.json(formatSquad(updated));
}));

// POST /api/squads/:id/members (invite)
router.post('/squads/:id/members', requireAuth, ah(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw boom(400, 'userId required');
  
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain && !member?.isViceCaptain) throw boom(403, 'Not authorized');
  
  // Create join request
  const request = await prisma.squadJoinRequest.create({
    data: { squadId: squad.id, userId },
  });
  
  res.json(request);
}));

// POST /api/squads/:id/join-requests/:requestId/accept
router.post('/squads/:id/join-requests/:requestId/accept', requireAuth, ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain) throw boom(403, 'Only captain can accept');
  
  const request = await prisma.squadJoinRequest.findUnique({
    where: { id: req.params.requestId },
  });
  if (!request) throw boom(404, 'Request not found');
  
  await prisma.squadJoinRequest.update({
    where: { id: request.id },
    data: { status: 'Accepted' },
  });
  
  await prisma.squadMember.create({
    data: { squadId: squad.id, userId: request.userId, role: 'Player' },
  });
  
  res.json({ status: 'accepted' });
}));

// POST /api/squads/:id/join-requests/:requestId/reject
router.post('/squads/:id/join-requests/:requestId/reject', requireAuth, ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain) throw boom(403, 'Only captain can reject');
  
  await prisma.squadJoinRequest.update({
    where: { id: req.params.requestId },
    data: { status: 'Rejected' },
  });
  
  res.json({ status: 'rejected' });
}));

// POST /api/squads/:id/members/:userId/remove
router.post('/squads/:id/members/:userId/remove', requireAuth, ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain) throw boom(403, 'Only captain can remove members');
  
  await prisma.squadMember.deleteMany({
    where: { squadId: squad.id, userId: req.params.userId },
  });
  
  res.json({ removed: true });
}));

// POST /api/squads/:id/leave
router.post('/squads/:id/leave', requireAuth, ah(async (req, res) => {
  await prisma.squadMember.deleteMany({
    where: { squadId: req.params.id, userId: req.user.id },
  });
  res.json({ left: true });
}));

// POST /api/squads/:id/members/:userId/assign-role
router.post('/squads/:id/members/:userId/assign-role', requireAuth, ah(async (req, res) => {
  const { role } = req.body;
  if (!role) throw boom(400, 'role required');
  
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: squad.id, userId: req.user.id } },
  });
  if (!member?.isCaptain) throw boom(403, 'Only captain can assign roles');
  
  const updated = await prisma.squadMember.update({
    where: { squadId_userId: { squadId: squad.id, userId: req.params.userId } },
    data: {
      role,
      isCaptain: role === 'Captain',
      isViceCaptain: role === 'Vice Captain',
    },
  });
  
  res.json(updated);
}));

// POST /api/squads/:id/assign-captain
router.post('/squads/:id/assign-captain', requireAuth, ah(async (req, res) => {
  const { newCaptainId } = req.body;
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  
  if (squad.captainId !== req.user.id) throw boom(403, 'Only captain can assign new captain');
  
  const updated = await prisma.squad.update({
    where: { id: squad.id },
    data: { captainId: newCaptainId },
  });
  
  res.json(updated);
}));

// GET /api/squads (search/list)
router.get('/squads', ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { q, sport, location } = req.query;
  
  const where = { status: 'Active' };
  if (q) where.OR = [{ name: { contains: q } }, { handle: { contains: q } }];
  if (sport) where.sport = sport;
  if (location) where.location = { contains: location };
  
  const squads = await prisma.squad.findMany({
    where,
    skip,
    take,
    orderBy: { followersBase: 'desc' },
  });
  
  res.json(squads.map(formatSquad));
}));

// POST /api/squads/:id/follow
router.post('/squads/:id/follow', requireAuth, ah(async (req, res) => {
  await prisma.follow.upsert({
    where: {
      followerId_kind_targetId: { followerId: req.user.id, kind: 'squad', targetId: req.params.id },
    },
    create: { followerId: req.user.id, kind: 'squad', targetId: req.params.id },
    update: {},
  });
  
  res.json({ following: true });
}));

// POST /api/squads/:id/unfollow
router.post('/squads/:id/unfollow', requireAuth, ah(async (req, res) => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user.id, kind: 'squad', targetId: req.params.id },
  });
  res.json({ following: false });
}));

// POST /api/squads/:id/chat
router.post('/squads/:id/chat', requireAuth, ah(async (req, res) => {
  const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
  if (!squad) throw boom(404, 'Squad not found');
  
  const members = await prisma.squadMember.findMany({
    where: { squadId: squad.id },
    select: { userId: true },
  });
  
  const room = await prisma.chatRoom.upsert({
    where: { type_refId: { type: 'squad', refId: squad.id } },
    create: {
      type: 'squad',
      title: `${squad.name} Chat`,
      members: JSON.stringify(members.map(m => m.userId)),
      refId: squad.id,
    },
    update: {},
  });
  
  res.json(room);
}));

module.exports = router;
