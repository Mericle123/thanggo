// Shared helpers
const prisma = require('../db');

const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const J = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
const S = v => JSON.stringify(v == null ? null : v);

const pick = (obj, keys) => keys.reduce((o, k) => { if (obj[k] !== undefined) o[k] = obj[k]; return o; }, {});

function paginate(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

const fail = (res, code, message, extra) => res.status(code).json({ error: message, ...(extra || {}) });

// 404 + error handler
function notFound(req, res) { res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.path }); }
function onError(err, req, res, next) {
  if (res.headersSent) return next(err);
  const code = err.status || 500;
  if (code >= 500) console.error('[error]', err);
  res.status(code).json({ error: err.message || 'Server error' });
}
function boom(status, message) { const e = new Error(message); e.status = status; return e; }

// Additional helpers for business logic
const formatUser = (u) => ({
  id: u.id, email: u.email, name: u.name, username: u.username, photo: u.photo,
  bio: u.bio, location: u.location, mainSport: u.mainSport, skillLevel: u.skillLevel,
  playingStyle: u.playingStyle, rating: u.rating, followers: u.followersBase,
  following: u.followingBase, role: u.role, status: u.status, verified: u.verified,
  profileComplete: u.profileComplete, createdAt: u.createdAt,
});

const formatSquad = (s) => ({
  id: s.id, name: s.name, handle: s.handle, sport: s.sport, location: s.location,
  skillLevel: s.skillLevel, description: s.description, logo: s.logo, banner: s.banner,
  captainId: s.captainId, rating: s.rating, followers: s.followersBase, status: s.status,
  verified: s.verified, wins: s.wins, losses: s.losses, draws: s.draws, createdAt: s.createdAt,
});

const checkOwnership = (userId, ownerId) => {
  if (userId !== ownerId) throw boom(403, 'Not authorized');
};

const isFollowing = async (followerId, kind, targetId) => {
  return !!await prisma.follow.findUnique({
    where: { followerId_kind_targetId: { followerId, kind, targetId } },
  });
};

module.exports = { ah, J, S, pick, paginate, fail, notFound, onError, boom, formatUser, formatSquad, checkOwnership, isFollowing };
