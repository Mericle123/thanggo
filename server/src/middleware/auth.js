const { prisma } = require('../lib/prisma');
const { ApiError, verifyAccess } = require('../lib/util');

const ADMIN_ROLES = ['Admin', 'Super Admin', 'Operations Admin', 'Venue Manager', 'Event Organizer', 'Finance Admin', 'Moderator', 'Support Staff'];
// section permissions for RBAC on admin routes
const ROLE_SECTIONS = {
  'Super Admin': '*', 'Admin': '*',
  'Operations Admin': ['users', 'venues', 'bookings', 'squads', 'events', 'registrations', 'reports', 'analytics', 'logs'],
  'Venue Manager': ['venues', 'bookings', 'analytics'],
  'Event Organizer': ['events', 'registrations', 'announcements', 'analytics'],
  'Finance Admin': ['payments', 'memberships', 'analytics', 'logs'],
  'Moderator': ['posts', 'comments', 'reports', 'users', 'logs'],
  'Support Staff': ['support', 'reports'],
};
const canAdmin = (role, section) => ROLE_SECTIONS[role] === '*' || (ROLE_SECTIONS[role] || []).includes(section);

async function authenticate(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id }, include: { profile: true } });
    if (!user) throw new ApiError(401, 'Invalid token');
    if (user.status === 'Banned' || user.status === 'Suspended') throw new ApiError(403, `Account ${user.status.toLowerCase()}`);
    req.user = user;
    next();
  } catch (e) { next(e instanceof ApiError ? e : new ApiError(401, 'Invalid or expired token')); }
}
function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return next();
  authenticate(req, res, () => next());
}
function requireRole(...roles) {
  return (req, res, next) => (roles.includes(req.user.role) ? next() : next(new ApiError(403, 'Forbidden: requires ' + roles.join(' / '))));
}
function requireAdmin(req, res, next) {
  return ADMIN_ROLES.includes(req.user.role) ? next() : next(new ApiError(403, 'Admin access required'));
}
function requireSection(section) {
  return (req, res, next) => (ADMIN_ROLES.includes(req.user.role) && canAdmin(req.user.role, section) ? next() : next(new ApiError(403, `Your role cannot access ${section}`)));
}

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, requireSection, ADMIN_ROLES, ROLE_SECTIONS, canAdmin };
