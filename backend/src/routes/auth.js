const router = require('express').Router();
const prisma = require('../db');
const { ah, boom } = require('../util');
const { publicUser } = require('../helpers');
const { hash, compare, signAccess, signRefresh, verifyRefresh, requireAuth } = require('../auth');

const tokens = u => ({ accessToken: signAccess(u), refreshToken: signRefresh(u) });

// POST /api/auth/register
router.post('/auth/register', ah(async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password || !name) throw boom(400, 'email, password and name are required');
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username: username || '__none__' }] } });
  if (exists) throw boom(409, 'Email or username already in use');
  const user = await prisma.user.create({
    data: {
      email, passwordHash: await hash(password), name,
      username: username || email.split('@')[0] + Math.floor(Math.random() * 1000),
      role: 'User', profileComplete: false,
    },
  });
  res.status(201).json({ user: publicUser(user), ...tokens(user) });
}));

// POST /api/auth/login
router.post('/auth/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email || '' } });
  if (!user || !(await compare(password || '', user.passwordHash))) throw boom(401, 'Invalid email or password');
  if (user.status === 'Banned') throw boom(403, 'Account banned');
  res.json({ user: publicUser(user), ...tokens(user) });
}));

// POST /api/auth/admin-login — same creds but must be an admin role
router.post('/auth/admin-login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email || '' } });
  if (!user || !(await compare(password || '', user.passwordHash))) throw boom(401, 'Invalid credentials');
  const { ADMIN_ROLES } = require('../auth');
  if (!ADMIN_ROLES.includes(user.role)) throw boom(403, 'Not an admin account');
  res.json({ user: publicUser(user), ...tokens(user) });
}));

// POST /api/auth/guest — demo login (creates/reuses a guest)
router.post('/auth/guest', ah(async (req, res) => {
  const username = 'guest' + Math.floor(Math.random() * 100000);
  const user = await prisma.user.create({
    data: { email: username + '@guest.thanggo.bt', passwordHash: await hash('guest'), name: 'Guest Player', username, isGuest: true, role: 'User' },
  });
  res.json({ user: publicUser(user), ...tokens(user) });
}));

// POST /api/auth/refresh
router.post('/auth/refresh', ah(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw boom(400, 'refreshToken required');
  let payload;
  try { payload = verifyRefresh(refreshToken); } catch { throw boom(401, 'Invalid refresh token'); }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw boom(401, 'User not found');
  res.json({ ...tokens(user) });
}));

// POST /api/auth/logout (stateless JWT — client discards tokens)
router.post('/auth/logout', (_req, res) => res.json({ ok: true }));

// GET /api/auth/me
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// POST /api/auth/complete-profile
router.post('/auth/complete-profile', requireAuth, ah(async (req, res) => {
  const f = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: f.name || req.user.name, username: f.username || req.user.username,
      photo: f.photo, location: f.location, mainSport: f.mainSport, skillLevel: f.skillLevel,
      availability: f.availability, playingStyle: f.playingStyle, bio: f.bio, contact: f.contact,
      profileComplete: true,
    },
  });
  res.json({ user: publicUser(user) });
}));

// POST /api/auth/forgot-password (placeholder)
router.post('/auth/forgot-password', (req, res) => res.json({ ok: true, message: 'Reset link sent (placeholder)', email: req.body.email }));
// POST /api/auth/verify (placeholder)
router.post('/auth/verify', requireAuth, ah(async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.user.id }, data: { verified: true } });
  res.json({ user: publicUser(u) });
}));

module.exports = router;
