const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./db');
const { boom } = require('./util');

const ACCESS = process.env.JWT_SECRET || 'dev-access';
const REFRESH = process.env.JWT_REFRESH_SECRET || 'dev-refresh';

const hash = pw => bcrypt.hash(pw, 10);
const compare = (pw, h) => bcrypt.compare(pw, h);

const signAccess = user => jwt.sign({ id: user.id, role: user.role }, ACCESS, { expiresIn: '2h' });
const signRefresh = user => jwt.sign({ id: user.id, t: 'refresh' }, REFRESH, { expiresIn: '30d' });
const verifyRefresh = token => jwt.verify(token, REFRESH);

// Roles that may access the admin panel
const ADMIN_ROLES = ['Admin', 'Super Admin', 'Moderator', 'Finance Admin', 'Support Staff', 'Operations Admin', 'Venue Manager', 'Event Organizer'];

// Attach req.user if a valid bearer token is present (does not throw)
async function attachUser(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, ACCESS);
      req.user = await prisma.user.findUnique({ where: { id: payload.id } });
    } catch { /* ignore invalid token */ }
  }
  next();
}

function requireAuth(req, _res, next) {
  if (!req.user) return next(boom(401, 'Authentication required'));
  if (req.user.status === 'Banned' || req.user.status === 'Suspended') return next(boom(403, 'Account ' + req.user.status.toLowerCase()));
  next();
}

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(boom(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(boom(403, 'Forbidden: requires ' + roles.join(' / ')));
  next();
};

function requireAdmin(req, _res, next) {
  if (!req.user) return next(boom(401, 'Authentication required'));
  if (!ADMIN_ROLES.includes(req.user.role)) return next(boom(403, 'Admin access only'));
  next();
}

module.exports = { hash, compare, signAccess, signRefresh, verifyRefresh, attachUser, requireAuth, requireRole, requireAdmin, ADMIN_ROLES };
