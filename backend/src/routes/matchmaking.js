// Matchmaking, Match Lobbies, and Tactics APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, J, S } = require('../util');
const { requireAuth } = require('../auth');

// ──────── MATCH POSTS (CHALLENGES) ────────

// POST /api/match-posts (create challenge)
router.post('/match-posts', requireAuth, ah(async (req, res) => {
  const { sport, title, caption, location, teamSize, skillLevel, venueId } = req.body;
  if (!sport || !title) throw boom(400, 'sport and title required');
  
  const post = await prisma.matchPost.create({
    data: {
      authorType: req.body.authorType || 'squad',
      createdBy: req.body.createdBy || req.user.id,
      sport,
      title,
      caption,
      location,
      teamSize,
      skillLevel,
      venueId,
      status: 'Looking for Opponent',
      image: req.body.image,
      media: S(req.body.media || []),
      tactics: S(req.body.tactics || {}),
      bookingId: req.body.bookingId,
      paymentSplit: req.body.paymentSplit || '50/50 Team Split',
    },
  });
  
  res.status(201).json(post);
}));

// GET /api/match-posts/:id
router.get('/match-posts/:id', ah(async (req, res) => {
  const post = await prisma.matchPost.findUnique({ where: { id: req.params.id } });
  if (!post) throw boom(404, 'Post not found');
  
  const requests = await prisma.matchRequest.findMany({
    where: { postId: post.id, status: 'Pending' },
  });
  
  res.json({
    ...post,
    media: J(post.media, []),
    tactics: J(post.tactics, {}),
    requestCount: requests.length,
  });
}));

// GET /api/match-posts (feed/search)
router.get('/match-posts', ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { sport, skillLevel, location, status } = req.query;
  
  const where = { modStatus: 'Active' };
  if (sport) where.sport = sport;
  if (skillLevel) where.skillLevel = skillLevel;
  if (location) where.location = { contains: location };
  if (status) where.status = status;
  
  const posts = await prisma.matchPost.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(posts.map(p => ({
    ...p,
    media: J(p.media, []),
    tactics: J(p.tactics, {}),
  })));
}));

// PUT /api/match-posts/:id (edit)
router.put('/match-posts/:id', requireAuth, ah(async (req, res) => {
  const post = await prisma.matchPost.findUnique({ where: { id: req.params.id } });
  if (!post || post.createdBy !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.matchPost.update({
    where: { id: req.params.id },
    data: {
      title: req.body.title,
      caption: req.body.caption,
      status: req.body.status,
      paymentSplit: req.body.paymentSplit,
    },
  });
  
  res.json(updated);
}));

// ──────── MATCH REQUESTS ────────

// POST /api/match-requests (request to compete)
router.post('/match-requests', requireAuth, ah(async (req, res) => {
  const { postId, requestingSquadId, message } = req.body;
  if (!postId || !requestingSquadId) throw boom(400, 'postId and requestingSquadId required');
  
  const post = await prisma.matchPost.findUnique({ where: { id: postId } });
  if (!post) throw boom(404, 'Post not found');
  
  const request = await prisma.matchRequest.create({
    data: {
      postId,
      requestingSquadId,
      hostSquadId: post.createdBy,
      message,
      status: 'Pending',
    },
  });
  
  res.status(201).json(request);
}));

// POST /api/match-requests/:id/accept (creates lobby)
router.post('/match-requests/:id/accept', requireAuth, ah(async (req, res) => {
  const request = await prisma.matchRequest.findUnique({ where: { id: req.params.id } });
  if (!request) throw boom(404, 'Request not found');
  
  const post = await prisma.matchPost.findUnique({ where: { id: request.postId } });
  if (post.createdBy !== req.user.id) throw boom(403, 'Not authorized');
  
  await prisma.matchRequest.update({
    where: { id: request.id },
    data: { status: 'Accepted' },
  });
  
  // Create lobby
  const lobby = await prisma.matchLobby.create({
    data: {
      postId: request.postId,
      teamAId: request.hostSquadId,
      teamBId: request.requestingSquadId,
      sport: post.sport,
      venueId: post.venueId,
      date: post.preferredTime,
      status: 'Opponent Accepted',
      paymentSplit: post.paymentSplit,
      bookingId: post.bookingId,
      tactics: post.tactics,
    },
  });
  
  // Create chat room
  const room = await prisma.chatRoom.create({
    data: {
      type: 'lobby',
      title: `Match Lobby`,
      refId: lobby.id,
      members: S([]),
    },
  });
  
  res.json({ lobby, chatRoom: room });
}));

// POST /api/match-requests/:id/reject
router.post('/match-requests/:id/reject', requireAuth, ah(async (req, res) => {
  const request = await prisma.matchRequest.findUnique({ where: { id: req.params.id } });
  if (!request) throw boom(404, 'Request not found');
  
  const post = await prisma.matchPost.findUnique({ where: { id: request.postId } });
  if (post.createdBy !== req.user.id) throw boom(403, 'Not authorized');
  
  await prisma.matchRequest.update({
    where: { id: request.id },
    data: { status: 'Rejected' },
  });
  
  res.json({ status: 'rejected' });
}));

// ──────── MATCH LOBBIES ────────

// GET /api/lobbies/:id
router.get('/lobbies/:id', ah(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) throw boom(404, 'Lobby not found');
  
  res.json({
    ...lobby,
    tactics: J(lobby.tactics, {}),
  });
}));

// PUT /api/lobbies/:id/lineup (confirm lineup)
router.put('/lobbies/:id/lineup', requireAuth, ah(async (req, res) => {
  const { teamId, lineup } = req.body;
  if (!teamId) throw boom(400, 'teamId required');
  
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) throw boom(404, 'Lobby not found');
  
  const isTeamA = teamId === lobby.teamAId;
  const isTeamB = teamId === lobby.teamBId;
  if (!isTeamA && !isTeamB) throw boom(403, 'Not authorized');
  
  const updated = await prisma.matchLobby.update({
    where: { id: req.params.id },
    data: {
      lineupAConfirmed: isTeamA ? true : undefined,
      lineupBConfirmed: isTeamB ? true : undefined,
    },
  });
  
  res.json(updated);
}));

// PUT /api/lobbies/:id/payment (accept payment terms)
router.put('/lobbies/:id/payment', requireAuth, ah(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) throw boom(404, 'Lobby not found');
  
  const updated = await prisma.matchLobby.update({
    where: { id: req.params.id },
    data: {
      paymentTermsAccepted: true,
      paymentStatus: 'Pending',
    },
  });
  
  res.json(updated);
}));

// POST /api/lobbies/:id/lock (lock match)
router.post('/lobbies/:id/lock', requireAuth, ah(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) throw boom(404, 'Lobby not found');
  
  // Validation
  const errors = [];
  if (!lobby.lineupAConfirmed) errors.push('Team A lineup not confirmed');
  if (!lobby.lineupBConfirmed) errors.push('Team B lineup not confirmed');
  if (!lobby.paymentTermsAccepted) errors.push('Payment terms not accepted');
  
  if (errors.length > 0) throw boom(400, errors.join(', '));
  
  const updated = await prisma.matchLobby.update({
    where: { id: req.params.id },
    data: { status: 'Match Locked' },
  });
  
  res.json(updated);
}));

// POST /api/lobbies/:id/complete (submit result)
router.post('/lobbies/:id/complete', requireAuth, ah(async (req, res) => {
  const { result, winnerTeamId } = req.body;
  
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) throw boom(404, 'Lobby not found');
  
  // Update squad stats
  const [squadA, squadB] = await Promise.all([
    prisma.squad.findUnique({ where: { id: lobby.teamAId } }),
    prisma.squad.findUnique({ where: { id: lobby.teamBId } }),
  ]);
  
  const isTeamAWinner = winnerTeamId === lobby.teamAId;
  
  await Promise.all([
    isTeamAWinner
      ? prisma.squad.update({ where: { id: squadA.id }, data: { wins: { increment: 1 } } })
      : prisma.squad.update({ where: { id: squadA.id }, data: { losses: { increment: 1 } } }),
    isTeamAWinner
      ? prisma.squad.update({ where: { id: squadB.id }, data: { losses: { increment: 1 } } })
      : prisma.squad.update({ where: { id: squadB.id }, data: { wins: { increment: 1 } } }),
  ]);
  
  const updated = await prisma.matchLobby.update({
    where: { id: req.params.id },
    data: {
      status: 'Completed',
      result,
      resultId: winnerTeamId,
    },
  });
  
  res.json(updated);
}));

// ──────── TACTICS ────────

// POST /api/tactics (create/save)
router.post('/tactics', requireAuth, ah(async (req, res) => {
  const { ownerKind, ownerId, name, sport, formation, roster, roles, positions } = req.body;
  if (!sport || !formation) throw boom(400, 'sport and formation required');
  
  const tactics = await prisma.tacticsPlan.create({
    data: {
      ownerKind: ownerKind || 'draft',
      ownerId: ownerId || req.user.id,
      name,
      sport,
      formation,
      roster: S(roster || []),
      roles: S(roles || {}),
      positions: S(positions || {}),
      captainId: req.user.id,
    },
  });
  
  res.status(201).json(tactics);
}));

// GET /api/tactics/:id
router.get('/tactics/:id', ah(async (req, res) => {
  const tactics = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id } });
  if (!tactics) throw boom(404, 'Tactics not found');
  
  res.json({
    ...tactics,
    roster: J(tactics.roster, []),
    roles: J(tactics.roles, {}),
    positions: J(tactics.positions, {}),
  });
}));

// PUT /api/tactics/:id
router.put('/tactics/:id', requireAuth, ah(async (req, res) => {
  const tactics = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id } });
  if (!tactics || tactics.captainId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.tacticsPlan.update({
    where: { id: req.params.id },
    data: {
      formation: req.body.formation,
      roster: req.body.roster ? S(req.body.roster) : undefined,
      roles: req.body.roles ? S(req.body.roles) : undefined,
      positions: req.body.positions ? S(req.body.positions) : undefined,
    },
  });
  
  res.json(updated);
}));

// POST /api/tactics/:id/lock
router.post('/tactics/:id/lock', requireAuth, ah(async (req, res) => {
  const tactics = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id } });
  if (!tactics || tactics.captainId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.tacticsPlan.update({
    where: { id: req.params.id },
    data: { locked: true },
  });
  
  res.json(updated);
}));

module.exports = router;
