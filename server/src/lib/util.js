const jwt = require('jsonwebtoken');

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, msg) => { throw new ApiError(status, msg); };

const pageArgs = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

// ── JWT ──
const ACCESS = process.env.JWT_SECRET || 'dev-secret';
const REFRESH = process.env.JWT_REFRESH_SECRET || 'dev-refresh';
const signAccess = (u) => jwt.sign({ id: u.id, role: u.role }, ACCESS, { expiresIn: process.env.ACCESS_TTL || '2h' });
const signRefresh = (u) => jwt.sign({ id: u.id, t: 'r' }, REFRESH, { expiresIn: process.env.REFRESH_TTL || '30d' });
const verifyAccess = (t) => jwt.verify(t, ACCESS);
const verifyRefresh = (t) => jwt.verify(t, REFRESH);

module.exports = { asyncH, ApiError, fail, pageArgs, signAccess, signRefresh, verifyAccess, verifyRefresh };
