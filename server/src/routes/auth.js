const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { asyncH, fail, signAccess, signRefresh, verifyRefresh } = require('../lib/util');
const { authenticate } = require('../middleware/auth');

const publicUser = (u) => ({ id: u.id, email: u.email, phone: u.phone, role: u.role, status: u.status, verified: u.verified, guest: u.guest, profile: u.profile || null });
const issue = (u) => ({ accessToken: signAccess(u), refreshToken: signRefresh(u) });
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';

// POST /api/auth/register
router.post('/register', asyncH(async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1), username: z.string().optional() }).parse(req.body);
  if (await prisma.user.findUnique({ where: { email: body.email } })) fail(409, 'Email already registered');
  let username = body.username || slug(body.name);
  let n = 0; while (await prisma.profile.findUnique({ where: { username } })) { n++; username = slug(body.name) + n; }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { email: body.email, passwordHash, role: 'User', profile: { create: { name: body.name, username, completed: false } } },
    include: { profile: true },
  });
  res.status(201).json({ user: publicUser(user), ...issue(user) });
}));

// POST /api/auth/login
router.post('/login', asyncH(async (req, res) => {
  const body = z.object({ email: z.string(), password: z.string() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email }, include: { profile: true } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) fail(401, 'Invalid email or password');
  if (user.status === 'Banned') fail(403, 'This account is banned');
  res.json({ user: publicUser(user), ...issue(user) });
}));

// POST /api/auth/guest — demo login
router.post('/guest', asyncH(async (_req, res) => {
  const email = `guest_${Date.now()}@thanggo.bt`;
  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash('guest', 10), guest: true, profile: { create: { name: 'Guest Player', username: 'guest' + Date.now(), completed: false } } },
    include: { profile: true },
  });
  res.json({ user: publicUser(user), ...issue(user) });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncH(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) fail(400, 'refreshToken required');
  let payload; try { payload = verifyRefresh(refreshToken); } catch { fail(401, 'Invalid refresh token'); }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) fail(401, 'Invalid refresh token');
  res.json({ accessToken: signAccess(user) });
}));

// POST /api/auth/logout (stateless — client drops tokens)
router.post('/logout', (_req, res) => res.json({ ok: true }));

// GET /api/auth/me
router.get('/me', authenticate, asyncH(async (req, res) => res.json({ user: publicUser(req.user) })));

// POST /api/auth/complete-profile
router.post('/complete-profile', authenticate, asyncH(async (req, res) => {
  const body = z.object({
    name: z.string().optional(), photo: z.string().optional(), location: z.string().optional(),
    mainSport: z.string().optional(), skillLevel: z.string().optional(), availability: z.string().optional(),
    playingStyle: z.string().optional(), bio: z.string().optional(),
  }).parse(req.body);
  const profile = await prisma.profile.update({ where: { userId: req.user.id }, data: { ...body, completed: true } });
  res.json({ profile });
}));

// POST /api/auth/forgot — placeholder
router.post('/forgot', asyncH(async (req, res) => res.json({ ok: true, message: 'If the email exists, a reset link has been sent (placeholder).' })));

module.exports = router;
