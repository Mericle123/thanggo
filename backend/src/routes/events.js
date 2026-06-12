// Events Management APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, J, S } = require('../util');
const { requireAuth } = require('../auth');

// POST /api/events (create)
router.post('/events', requireAuth, ah(async (req, res) => {
  const { title, sport, eventType, location, date, deadline, fee, capacity } = req.body;
  if (!title || !sport || !date) throw boom(400, 'title, sport, date required');
  
  const event = await prisma.event.create({
    data: {
      title,
      sport,
      eventType: eventType || 'Tournament',
      location,
      date,
      deadline,
      fee,
      capacity: capacity || 16,
      organizerId: req.user.id,
      status: 'Registration Open',
    },
  });
  
  res.status(201).json(event);
}));

// GET /api/events/:id
router.get('/events/:id', ah(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw boom(404, 'Event not found');
  
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id, status: 'Confirmed' },
  });
  
  res.json({
    ...event,
    registeredCount: registrations.length,
    slots: J(event.slots, []),
  });
}));

// PUT /api/events/:id (edit)
router.put('/events/:id', requireAuth, ah(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event || event.organizerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      title: req.body.title,
      status: req.body.status,
      deadline: req.body.deadline,
      capacity: req.body.capacity,
    },
  });
  
  res.json(updated);
}));

// POST /api/events/:id/register (individual or squad)
router.post('/events/:id/register', requireAuth, ah(async (req, res) => {
  const { kind, squadId, members } = req.body;
  if (!kind) throw boom(400, 'kind required');
  
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw boom(404, 'Event not found');
  
  if (event.registered >= event.capacity) throw boom(400, 'Event is full');
  
  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: event.id,
      userId: req.user.id,
      squadId,
      kind: kind || 'individual',
      members: S(members || []),
      status: 'Submitted',
      paymentStatus: 'Not Started',
    },
  });
  
  await prisma.event.update({
    where: { id: event.id },
    data: { registered: { increment: 1 } },
  });
  
  res.status(201).json(registration);
}));

// POST /api/events/:id/registrations/:regId/confirm
router.post('/events/:id/registrations/:regId/confirm', requireAuth, ah(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event || event.organizerId !== req.user.id) throw boom(403, 'Not authorized');
  
  const registration = await prisma.eventRegistration.update({
    where: { id: req.params.regId },
    data: { status: 'Confirmed' },
  });
  
  res.json(registration);
}));

// GET /api/events (search/list)
router.get('/events', ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { q, sport, status } = req.query;
  
  const where = {};
  if (q) where.title = { contains: q };
  if (sport) where.sport = sport;
  if (status) where.status = status;
  
  const events = await prisma.event.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(events);
}));

// POST /api/events/:id/follow
router.post('/events/:id/follow', requireAuth, ah(async (req, res) => {
  await prisma.follow.upsert({
    where: {
      followerId_kind_targetId: { followerId: req.user.id, kind: 'event', targetId: req.params.id },
    },
    create: { followerId: req.user.id, kind: 'event', targetId: req.params.id },
    update: {},
  });
  res.json({ following: true });
}));

module.exports = router;
