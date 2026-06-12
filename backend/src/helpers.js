const prisma = require('./db');
const rt = require('./realtime');
const { S } = require('./util');

// Create a notification + push it in realtime
async function notify(userId, n) {
  if (!userId) return null;
  const row = await prisma.notification.create({
    data: {
      userId, type: n.type, title: n.title, body: n.body || null,
      entityType: n.entityType || null, entityId: n.entityId || null,
      route: n.route || null, params: n.params ? S(n.params) : null,
    },
  });
  rt.toUser(userId, 'notification', row);
  return row;
}

// Log an admin action
const logAdmin = (req, action, target, detail) => prisma.adminActivityLog.create({
  data: { adminId: req.user ? req.user.id : null, adminRole: req.user ? req.user.role : null, action, target: target || null, detail: detail || null },
}).catch(() => {});

// Public-safe user shape
function publicUser(u) {
  if (!u) return null;
  const { passwordHash, email, phone, ...rest } = u;
  return rest;
}

// Counts for a post (likes/comments/saves/shares)
async function postCounts(postId, base = {}) {
  const [likes, comments, saves, liked] = await Promise.all([
    prisma.like.count({ where: { targetType: 'post', targetId: postId } }),
    prisma.comment.count({ where: { postId, modStatus: 'Active' } }),
    prisma.savedItem.count({ where: { targetType: 'post', targetId: postId } }),
    null,
  ]);
  return { likes: likes + (base.likesBase || 0), comments, saves, shares: base.sharesBase || 0 };
}

async function followerCount(kind, targetId, base = 0) {
  const n = await prisma.follow.count({ where: { kind, targetId } });
  return n + (base || 0);
}

module.exports = { notify, logAdmin, publicUser, postCounts, followerCount };
