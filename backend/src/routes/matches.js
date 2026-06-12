const router = require('express').Router();
const prisma = require('../db');
const rt = require('../realtime');
const { ah, boom, J, S } = require('../util');
const { notify } = require('../helpers');
const { requireAuth } = require('../auth');

// ── Match challenge posts (stored in Post table, postType "Match Challenge") ──
router.get('/match-posts', ah(async (req, res) => {
  const where = { postType: 'Match Challenge', modStatus: 'Active' };
  if (req.query.sport && req.query.sport !== 'All') where.sport = req.query.sport;
  const items = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ items });
}));

router.post('/match-posts', requireAuth, ah(async (req, res) => {
  const b = req.body;
  const post = await prisma.post.create({
    data: {
      authorType: 'squad', createdBy: b.squadId || b.createdBy, postType: 'Match Challenge', sport: b.sport, title: b.title,
      caption: b.caption, location: b.location, preferredTime: b.preferredTime, venueId: b.venueId, venueName: b.venueName,
      teamSize: b.teamSize, skillLevel: b.skillLevel, paymentSplit: b.paymentSplit, status: 'Looking for Opponent',
      expiry: b.expiry, image: b.image, media: b.media ? S(b.media) : null, tactics: b.tactics ? S(b.tactics) : null, bookingId: b.bookingId,
    },
  });
  if (b.bookingId) await prisma.booking.update({ where: { id: b.bookingId }, data: { postId: post.id } }).catch(() => {});
  res.status(201).json({ post });
}));

router.get('/match-posts/:id/requests', ah(async (req, res) =>
  res.json({ items: await prisma.matchRequest.findMany({ where: { postId: req.params.id }, orderBy: { createdAt: 'desc' } }) })));

// ── Match requests ──
router.post('/match-requests', requireAuth, ah(async (req, res) => {
  const { postId, requestingSquadId, message } = req.body;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw boom(404, 'Post not found');
  const r = await prisma.matchRequest.create({ data: { postId, requestingSquadId, hostSquadId: post.createdBy, message, status: 'Pending' } });
  await prisma.post.update({ where: { id: postId }, data: { status: 'Requests Received' } });
  const host = await prisma.squad.findUnique({ where: { id: post.createdBy } });
  const reqSquad = await prisma.squad.findUnique({ where: { id: requestingSquadId } });
  if (host) notify(host.captainId, { type: 'request', title: 'New opponent request', body: (reqSquad ? reqSquad.name : 'A squad') + ' requested to compete', entityType: 'post', entityId: postId, route: 'postDetail', params: { id: postId, focus: 'interested' } });
  res.status(201).json({ request: r });
}));

router.post('/match-requests/:id/respond', requireAuth, ah(async (req, res) => {
  const reqRow = await prisma.matchRequest.findUnique({ where: { id: req.params.id } });
  if (!reqRow) throw boom(404, 'Request not found');
  const accept = !!req.body.accept;
  if (!accept) {
    await prisma.matchRequest.update({ where: { id: reqRow.id }, data: { status: 'Rejected' } });
    const rs = await prisma.squad.findUnique({ where: { id: reqRow.requestingSquadId } });
    if (rs) notify(rs.captainId, { type: 'rejected', title: 'Request declined', body: 'Your challenge request was declined' });
    return res.json({ ok: true, status: 'Rejected' });
  }
  // accept: reject siblings, update post, create lobby + chat room
  await prisma.matchRequest.update({ where: { id: reqRow.id }, data: { status: 'Accepted' } });
  await prisma.matchRequest.updateMany({ where: { postId: reqRow.postId, id: { not: reqRow.id }, status: 'Pending' }, data: { status: 'Rejected' } });
  const post = await prisma.post.findUnique({ where: { id: reqRow.postId } });
  await prisma.post.update({ where: { id: post.id }, data: { status: 'Opponent Accepted' } });
  const teamA = await prisma.squad.findUnique({ where: { id: reqRow.hostSquadId } });
  const teamB = await prisma.squad.findUnique({ where: { id: reqRow.requestingSquadId } });
  const room = await prisma.chatRoom.create({ data: { type: 'lobby', title: teamA.name + ' vs ' + teamB.name, subtitle: 'Match lobby', members: S([teamA.captainId, teamB.captainId]) } });
  const lobby = await prisma.matchLobby.create({
    data: {
      postId: post.id, bookingId: post.bookingId, teamAId: teamA.id, teamBId: teamB.id, sport: post.sport,
      venueId: post.venueId, date: post.preferredTime, status: 'Opponent Accepted', paymentSplit: post.paymentSplit || '50/50 Team Split',
      threadId: room.id, tactics: post.tactics || null,
    },
  });
  if (post.bookingId) await prisma.booking.update({ where: { id: post.bookingId }, data: { lobbyId: lobby.id } }).catch(() => {});
  notify(teamA.captainId, { type: 'accepted', title: 'Match lobby created', body: 'vs ' + teamB.name, entityType: 'lobby', entityId: lobby.id, route: 'matchLobby', params: { id: lobby.id } });
  notify(teamB.captainId, { type: 'accepted', title: 'Challenge accepted', body: 'Lobby vs ' + teamA.name + ' is ready', entityType: 'lobby', entityId: lobby.id, route: 'matchLobby', params: { id: lobby.id } });
  res.json({ ok: true, status: 'Accepted', lobby });
}));

// ── Lobbies ──
router.get('/lobbies', ah(async (req, res) => res.json({ items: await prisma.matchLobby.findMany({ orderBy: { createdAt: 'desc' } }) })));
router.get('/lobbies/:id', ah(async (req, res) => { const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } }); if (!l) throw boom(404, 'Lobby not found'); res.json({ lobby: l }); }));

const updateLobby = (id, data) => prisma.matchLobby.update({ where: { id }, data }).then(l => { rt.toLobby(id, 'lobby:update', l); return l; });

router.post('/lobbies/:id/ready', requireAuth, ah(async (req, res) => {
  const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  const req5 = 5; const on = l.readyA >= req5;
  res.json({ lobby: await updateLobby(l.id, { readyA: on ? 0 : req5, readyB: on ? 0 : req5, status: on ? 'Opponent Accepted' : 'Waiting for Lineup' }) });
}));
router.post('/lobbies/:id/confirm-lineup', requireAuth, ah(async (req, res) => res.json({ lobby: await updateLobby(req.params.id, { lineupAConfirmed: true, lineupBConfirmed: true, status: 'Waiting for Payment' }) })));
router.post('/lobbies/:id/accept-terms', requireAuth, ah(async (req, res) => {
  const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  res.json({ lobby: await updateLobby(l.id, { paymentTermsAccepted: true, paymentStatus: l.paymentStatus === 'Not Started' ? 'Pending' : l.paymentStatus, status: 'Waiting for Payment' }) });
}));
router.post('/lobbies/:id/pay', requireAuth, ah(async (req, res) => {
  const l = await updateLobby(req.params.id, { paymentStatus: 'Paid', status: 'Ready to Lock' });
  notify(req.user.id, { type: 'payDone', title: 'Payment completed', body: 'Match payment received', entityType: 'lobby', entityId: l.id });
  res.json({ lobby: l });
}));
router.post('/lobbies/:id/lock', requireAuth, ah(async (req, res) => {
  const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  const missing = [];
  const req5 = 5;
  if (!(l.readyA >= req5 && l.readyB >= req5)) missing.push('both teams ready');
  if (!(l.lineupAConfirmed && l.lineupBConfirmed)) missing.push('lineups confirmed');
  if (!l.paymentTermsAccepted) missing.push('payment terms accepted');
  if (!l.venueId) missing.push('venue booked');
  if (!['Paid', 'Pending', 'Partially Paid'].includes(l.paymentStatus)) missing.push('valid payment status');
  if (l.bookingId) { const bk = await prisma.booking.findUnique({ where: { id: l.bookingId } }); if (!bk || bk.status !== 'Confirmed') missing.push('venue booking confirmed'); }
  if (missing.length) throw boom(400, 'Cannot lock match — missing: ' + missing.join(', '), { missing });
  const out = await updateLobby(l.id, { status: 'Match Locked' });
  notify(l.teamAId && (await prisma.squad.findUnique({ where: { id: l.teamAId } })).captainId, { type: 'locked', title: 'Match locked 🔒', body: 'Your match is confirmed', entityType: 'lobby', entityId: l.id, route: 'matchLobby', params: { id: l.id } });
  res.json({ lobby: out });
}));
router.post('/lobbies/:id/cancel', requireAuth, ah(async (req, res) => res.json({ lobby: await updateLobby(req.params.id, { status: 'Cancelled' }) })));
router.post('/lobbies/:id/complete', requireAuth, ah(async (req, res) => res.json({ lobby: await updateLobby(req.params.id, { status: 'Completed' }) })));

// result submission
router.post('/lobbies/:id/result', requireAuth, ah(async (req, res) => {
  const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  const { scoreA, scoreB } = req.body;
  const result = `${scoreA} - ${scoreB}`;
  const out = await updateLobby(l.id, { status: 'Completed', result, resultId: 'pending' });
  // update squad records on confirm; here mark pending confirmation via notification
  const teamB = await prisma.squad.findUnique({ where: { id: l.teamBId } });
  if (teamB) notify(teamB.captainId, { type: 'accepted', title: 'Result submitted', body: result + ' — confirm or dispute', entityType: 'lobby', entityId: l.id, route: 'settlement', params: { lobbyId: l.id } });
  res.json({ lobby: out });
}));
router.post('/lobbies/:id/result/confirm', requireAuth, ah(async (req, res) => {
  const l = await prisma.matchLobby.findUnique({ where: { id: req.params.id } });
  // bump squad records based on result
  if (l.result) {
    const [a, b] = l.result.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(a) && !isNaN(b)) {
      await prisma.squad.update({ where: { id: l.teamAId }, data: a > b ? { wins: { increment: 1 } } : a < b ? { losses: { increment: 1 } } : { draws: { increment: 1 } } });
      await prisma.squad.update({ where: { id: l.teamBId }, data: b > a ? { wins: { increment: 1 } } : b < a ? { losses: { increment: 1 } } : { draws: { increment: 1 } } });
    }
  }
  res.json({ lobby: await updateLobby(l.id, { resultId: 'confirmed' }) });
}));
router.post('/lobbies/:id/result/dispute', requireAuth, ah(async (req, res) => res.json({ lobby: await updateLobby(req.params.id, { status: 'Disputed' }) })));

module.exports = router;
