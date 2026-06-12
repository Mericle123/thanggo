// Chat APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, J, S } = require('../util');
const { requireAuth } = require('../auth');

// POST /api/chats (create or get room)
router.post('/chats', requireAuth, ah(async (req, res) => {
  const { type, title, members, refId } = req.body;
  if (!type || !title) throw boom(400, 'type and title required');
  
  const room = await prisma.chatRoom.create({
    data: {
      type,
      title,
      refId,
      members: S(members || [req.user.id]),
    },
  });
  
  res.status(201).json(room);
}));

// GET /api/chats/:id
router.get('/chats/:id', requireAuth, ah(async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) throw boom(404, 'Chat room not found');
  
  const members = J(room.members, []);
  if (!members.includes(req.user.id) && req.user.role !== 'Admin') throw boom(403, 'Not a member');
  
  res.json(room);
}));

// GET /api/chats/:id/messages
router.get('/chats/:id/messages', requireAuth, ah(async (req, res) => {
  const { skip, take } = paginate(req);
  
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) throw boom(404, 'Chat room not found');
  
  const messages = await prisma.chatMessage.findMany({
    where: { roomId: req.params.id },
    skip,
    take,
    orderBy: { createdAt: 'asc' },
  });
  
  res.json(messages);
}));

// POST /api/chats/:id/messages (send message via REST)
router.post('/chats/:id/messages', requireAuth, ah(async (req, res) => {
  const { text, type } = req.body;
  if (!text) throw boom(400, 'text required');
  
  const room = await prisma.chatRoom.findUnique({ where: { id: req.params.id } });
  if (!room) throw boom(404, 'Chat room not found');
  
  const message = await prisma.chatMessage.create({
    data: {
      roomId: req.params.id,
      userId: req.user.id,
      text,
      type: type || 'text',
    },
  });
  
  res.status(201).json(message);
}));

// GET /api/users/:id/chats (list user's chat rooms)
router.get('/users/:id/chats', requireAuth, ah(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'Admin') throw boom(403, 'Not authorized');
  
  const rooms = await prisma.chatRoom.findMany({
    where: {},
    orderBy: { createdAt: 'desc' },
  });
  
  // Filter rooms that user is member of
  const userRooms = rooms.filter(r => {
    const members = J(r.members, []);
    return members.includes(req.user.id);
  });
  
  res.json(userRooms);
}));

// GET /api/chats/:id/read (get unread count)
router.get('/chats/:id/read', requireAuth, ah(async (req, res) => {
  const read = await prisma.chatRead.findUnique({
    where: { roomId_userId: { roomId: req.params.id, userId: req.user.id } },
  }).catch(() => null);
  
  const count = read?.count || 0;
  res.json({ unreadCount: count });
}));

// PUT /api/chats/:id/read (mark as read)
router.put('/chats/:id/read', requireAuth, ah(async (req, res) => {
  await prisma.chatRead.upsert({
    where: { roomId_userId: { roomId: req.params.id, userId: req.user.id } },
    create: { roomId: req.params.id, userId: req.user.id, count: 0 },
    update: { count: 0 },
  });
  
  res.json({ marked: true });
}));

module.exports = router;
