const router = require('express').Router();
const { prisma, jstr, jparse } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { notify, emitLobby } = require('../lib/realtime');

async function canEditTactics(plan, userId) {
  if (plan.ownerType === 'draft') return true;
  let squadId = plan.ownerType === 'squad' ? plan.ownerId : null;
  if (plan.ownerType === 'lobby') { const l = await prisma.matchLobby.findUnique({ where: { id: plan.ownerId } }); squadId = l?.teamAId; }
  if (!squadId) return false;
  const s = await prisma.squad.findUnique({ where: { id: squadId } });
  if (s && s.captainId === userId) return true;
  const m = await prisma.squadMember.findUnique({ where: { squadId_userId: { squadId, userId } } }).catch(() => null);
  return !!(m && (m.isCaptain || m.isViceCaptain));
}

// GET /api/match/posts  (matchmaking feed)
router.get('/posts', asyncH(async (req, res) => {
  const where = { postType: 'Match Challenge', modStatus: 'Active', ...(req.query.sport && req.query.sport !== 'All' ? { sport: req.query.sport } : {}) };
  const items = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ items });
}));

// GET /api/match/challengers  (opponent squads)
router.get('/challengers', asyncH(async (req, res) => {
  const { sport, location, skill } = req.query;
  const where = { AND: [sport && sport !== 'All' ? { sport } : {}, location && location !== 'All' ? { location } : {}, skill && skill !== 'All' ? { skillLevel: skill } : {}] };
  const items = await prisma.squad.findMany({ where, include: { _count: { select: { members: true } } } });
  res.json({ items });
}));

// POST /api/match/requests
router.post('/requests', authenticate, asyncH(async (req, res) => {
  const { postId, requestingSquadId, message } = req.body;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) fail(404, 'Post not found');
  const r = await prisma.matchRequest.create({ data: { postId, requestingSquadId, hostSquadId: post.squadId || post.authorId, message: message || null } });
  const host = await prisma.squad.findUnique({ where: { id: post.squadId || post.authorId } });
  if (host) notify(host.captainId, { title: 'New opponent request', message: 'A squad requested to compete in your challenge', type: 'request', entityType: 'post', entityId: postId }).catch(() => {});
  res.status(201).json({ request: r });
}));

// GET /api/match/posts/:id/requests
router.get('/posts/:id/requests', asyncH(async (req, res) => res.json({ items: await prisma.matchRequest.findMany({ where: { postId: req.params.id } }) })));

// POST /api/match/requests/:id/accept  → creates lobby
router.post('/requests/:id/accept', authenticate, asyncH(async (req, res) => {
  const reqRow = await prisma.matchRequest.findUnique({ where: { id: req.params.id } });
  if (!reqRow) fail(404, 'Request not found');
  const post = await prisma.post.findUnique({ where: { id: reqRow.postId } });
  await prisma.matchRequest.update({ where: { id: reqRow.id }, data: { status: 'Accepted' } });
  await prisma.matchRequest.updateMany({ where: { postId: reqRow.postId, id: { not: reqRow.id }, status: 'Pending' }, data: { status: 'Rejected' } });
  await prisma.post.update({ where: { id: reqRow.postId }, data: { status: 'Opponent Accepted' } });
  const teamA = post.squadId || post.authorId;
  const room = await prisma.chatRoom.create({ data: { type: 'lobby', title: 'Match Lobby Chat', members: jstr([]) } });
  const lobby = await prisma.matchLobby.create({
    data: {
      postId: post.id, bookingId: post.bookingId || null, teamAId: teamA, teamBId: reqRow.requestingSquadId, sport: post.sport || 'Futsal',
      venueId: post.venueId || null, date: post.preferredTime || 'Tonight, 7:00 PM', status: 'Opponent Accepted',
      paymentSplit: post.paymentSplit || '50/50 Team Split', threadId: room.id,
    },
  });
  const [a, b] = await Promise.all([prisma.squad.findUnique({ where: { id: teamA } }), prisma.squad.findUnique({ where: { id: reqRow.requestingSquadId } })]);
  if (a) notify(a.captainId, { title: 'Request accepted — lobby created', type: 'accepted', entityType: 'lobby', entityId: lobby.id }).catch(() => {});
  if (b) notify(b.captainId, { title: 'Your challenge was accepted', type: 'accepted', entityType: 'lobby', entityId: lobby.id }).catch(() => {});
  res.status(201).json({ lobby });
}));

// POST /api/match/requests/:id/reject
router.post('/requests/:id/reject', authenticate, asyncH(async (req, res) => {
  res.json({ request: await prisma.matchRequest.update({ where: { id: req.params.id }, data: { status: 'Rejected' } }) });
}));

// ── Lobbies ──
router.get('/lobbies/:id', asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id }, include: { lineup: true } });
  if (!lobby) fail(404, 'Lobby not found');
  res.json({ lobby });
}));
router.post('/lobbies/:id/ready', authenticate, asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  const on = lobby.readyA < 5;
  const updated = await prisma.matchLobby.update({ where: { id: lobby.id }, data: { readyA: on ? 5 : 0, readyB: on ? 5 : 0, status: on ? 'Waiting for Lineup' : 'Opponent Accepted' } });
  emitLobby(lobby.id, 'lobby:update', updated);
  res.json({ lobby: updated });
}));
router.post('/lobbies/:id/confirm-lineup', authenticate, asyncH(async (req, res) => {
  const updated = await prisma.matchLobby.update({ where: { id: req.params.id }, data: { lineupAConfirmed: true, lineupBConfirmed: true, status: 'Waiting for Payment' } });
  emitLobby(req.params.id, 'lobby:update', updated); res.json({ lobby: updated });
}));
router.post('/lobbies/:id/accept-terms', authenticate, asyncH(async (req, res) => {
  const updated = await prisma.matchLobby.update({ where: { id: req.params.id }, data: { paymentTermsAccepted: true, paymentStatus: 'Pending', status: 'Waiting for Payment' } });
  emitLobby(req.params.id, 'lobby:update', updated); res.json({ lobby: updated });
}));
router.post('/lobbies/:id/pay', authenticate, asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  const updated = await prisma.matchLobby.update({ where: { id: lobby.id }, data: { paymentStatus: 'Paid', status: 'Ready to Lock' } });
  if (lobby.bookingId) await prisma.booking.update({ where: { id: lobby.bookingId }, data: { status: 'Confirmed', paymentStatus: 'Paid' } }).catch(() => {});
  await prisma.payment.create({ data: { userId: req.user.id, purpose: 'Match Payment', amount: 1200, status: 'Paid', lobbyId: lobby.id, method: 'mBoB Wallet' } }).catch(() => {});
  emitLobby(lobby.id, 'lobby:update', updated); res.json({ lobby: updated });
}));

// POST /api/match/lobbies/:id/lock  (validates lock conditions)
router.post('/lobbies/:id/lock', authenticate, asyncH(async (req, res) => {
  const lobby = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  if (!lobby) fail(404, 'Lobby not found');
  const missing = [];
  if (!(lobby.readyA >= 5 && lobby.readyB >= 5)) missing.push('both teams ready');
  if (!(lobby.lineupAConfirmed && lobby.lineupBConfirmed)) missing.push('lineups confirmed');
  if (!lobby.paymentTermsAccepted) missing.push('payment terms accepted');
  if (!lobby.venueId) missing.push('venue selected');
  if (!['Paid', 'Pending', 'Partially Paid'].includes(lobby.paymentStatus)) missing.push('valid payment status');
  if (lobby.bookingId) { const bk = await prisma.booking.findUnique({ where: { id: lobby.bookingId } }); if (!bk || bk.status !== 'Confirmed') missing.push('venue booking confirmed'); }
  if (missing.length) return res.status(422).json({ error: 'Cannot lock match. Missing: ' + missing.join(', '), missing });
  const updated = await prisma.matchLobby.update({ where: { id: lobby.id }, data: { status: 'Match Locked' } });
  const [a, b] = await Promise.all([prisma.squad.findUnique({ where: { id: lobby.teamAId } }), prisma.squad.findUnique({ where: { id: lobby.teamBId } })]);
  [a, b].forEach((s) => s && notify(s.captainId, { title: 'Match locked 🔒', type: 'locked', entityType: 'lobby', entityId: lobby.id }).catch(() => {}));
  emitLobby(lobby.id, 'lobby:update', updated);
  res.json({ lobby: updated });
}));
router.post('/lobbies/:id/complete', authenticate, asyncH(async (req, res) => res.json({ lobby: await prisma.matchLobby.update({ where: { id: req.params.id }, data: { status: 'Completed', result: req.body.result || null } }) })));
router.post('/lobbies/:id/cancel', authenticate, asyncH(async (req, res) => res.json({ lobby: await prisma.matchLobby.update({ where: { id: req.params.id }, data: { status: 'Cancelled' } }) })));

// ── Tactics ──
router.post('/tactics', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  const plan = await prisma.tacticsPlan.create({
    data: {
      ownerType: b.ownerType || 'squad', ownerId: b.ownerId, name: b.name || null, sport: b.sport || 'Futsal',
      formation: b.formation || 'Custom', notes: b.notes || null, tactics: jstr(b.tactics || []), captainId: req.user.id,
      positions: { create: (b.positions || []).map((p) => ({ pid: p.pid, name: p.name, num: p.num, role: p.role, x: p.x ?? 50, y: p.y ?? 50, cap: !!p.cap })) },
    },
    include: { positions: true },
  });
  res.status(201).json({ plan: { ...plan, tactics: jparse(plan.tactics) } });
}));
router.get('/tactics/:id', asyncH(async (req, res) => {
  const plan = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id }, include: { positions: true } });
  if (!plan) fail(404, 'Tactics plan not found');
  res.json({ plan: { ...plan, tactics: jparse(plan.tactics) } });
}));
router.put('/tactics/:id', authenticate, asyncH(async (req, res) => {
  const plan = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) fail(404, 'Not found');
  if (!(await canEditTactics(plan, req.user.id))) fail(403, 'Only the squad captain or vice-captain can edit tactics');
  if (plan.locked) fail(409, 'Tactics are locked — unlock to edit');
  const b = req.body; const data = {};
  ['name', 'formation', 'notes', 'sport'].forEach((k) => { if (b[k] !== undefined) data[k] = b[k]; });
  if (b.tactics !== undefined) data.tactics = jstr(b.tactics);
  if (b.positions) {
    await prisma.tacticsPlayerPosition.deleteMany({ where: { planId: plan.id } });
    data.positions = { create: b.positions.map((p) => ({ pid: p.pid, name: p.name, num: p.num, role: p.role, x: p.x ?? 50, y: p.y ?? 50, cap: !!p.cap })) };
  }
  const updated = await prisma.tacticsPlan.update({ where: { id: plan.id }, data, include: { positions: true } });
  res.json({ plan: { ...updated, tactics: jparse(updated.tactics) } });
}));
router.post('/tactics/:id/lock', authenticate, asyncH(async (req, res) => {
  const plan = await prisma.tacticsPlan.findUnique({ where: { id: req.params.id } });
  if (!(await canEditTactics(plan, req.user.id))) fail(403, 'Captain only');
  const locked = req.body.locked !== false;
  res.json({ plan: await prisma.tacticsPlan.update({ where: { id: req.params.id }, data: { locked } }) });
}));

module.exports = router;
