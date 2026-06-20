const router = require('express').Router();
const { prisma, jstr, jparse } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');
const { emitRoom, notify } = require('../lib/realtime');

const hasMember = (room, uid) => (jparse(room.members, []) || []).includes(uid);

// GET /api/chats  (my rooms)
router.get('/', authenticate, asyncH(async (req, res) => {
  const rooms = await prisma.chatRoom.findMany({ orderBy: { createdAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } });
  const mine = rooms.filter((r) => hasMember(r, req.user.id));
  res.json({ items: mine.map((r) => ({ ...r, members: jparse(r.members, []), last: r.messages[0] || null })) });
}));

// POST /api/chats/rooms
router.post('/rooms', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  const members = Array.from(new Set([req.user.id, ...(b.members || [])]));
  const room = await prisma.chatRoom.create({ data: { type: b.type || 'direct', title: b.title || null, subtitle: b.subtitle || null, refId: b.refId || null, members: jstr(members) } });
  res.status(201).json({ room: { ...room, members } });
}));

// POST /api/chats/direct/:userId  (ensure 1-1 room)
router.post('/direct/:userId', authenticate, asyncH(async (req, res) => {
  const other = req.params.userId;
  const rooms = await prisma.chatRoom.findMany({ where: { type: 'direct' } });
  let room = rooms.find((r) => { const m = jparse(r.members, []); return m.length === 2 && m.includes(req.user.id) && m.includes(other); });
  if (!room) {
    const p = await prisma.profile.findUnique({ where: { userId: other } });
    room = await prisma.chatRoom.create({ data: { type: 'direct', title: p?.name || 'Chat', subtitle: p ? '@' + p.username : null, members: jstr([req.user.id, other]) } });
  }
  res.json({ room: { ...room, members: jparse(room.members, []) } });
}));

// GET /api/chats/rooms/:id/messages
router.get('/rooms/:id/messages', authenticate, asyncH(async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) fail(404, 'Room not found');
  res.json({ room: { ...room, members: jparse(room.members, []) }, messages: await prisma.chatMessage.findMany({ where: { roomId: room.id }, orderBy: { createdAt: 'asc' } }) });
}));

// POST /api/chats/rooms/:id/messages
router.post('/rooms/:id/messages', authenticate, asyncH(async (req, res) => {
  if (!req.body.text || !req.body.text.trim()) fail(400, 'Message text required');
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) fail(404, 'Room not found');
  const msg = await prisma.chatMessage.create({ data: { roomId: room.id, senderId: req.user.id, text: req.body.text.trim() } });
  emitRoom(room.id, 'chat:message', msg);
  jparse(room.members, []).filter((u) => u !== req.user.id).forEach((u) => notify(u, { title: room.title || 'New message', message: msg.text.slice(0, 60), type: 'message', entityType: 'chat', entityId: room.id }).catch(() => {}));
  res.status(201).json({ message: msg });
}));

// POST /api/chats/rooms/:id/read
router.post('/rooms/:id/read', authenticate, asyncH(async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  const reads = jparse(room.reads, {}) || {};
  reads[req.user.id] = new Date().toISOString();
  await prisma.chatRoom.update({ where: { id: room.id }, data: { reads: jstr(reads) } });
  res.json({ ok: true });
}));

module.exports = router;
