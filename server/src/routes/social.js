const router = require('express').Router();
const { prisma, jstr, jparse } = require('../lib/prisma');
const { asyncH, fail, pageArgs } = require('../lib/util');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { notify, emitTo } = require('../lib/realtime');

async function decorate(post, userId) {
  const [commentCount, liked, saved] = await Promise.all([
    prisma.comment.count({ where: { postId: post.id } }),
    userId ? prisma.like.findUnique({ where: { userId_targetType_targetId: { userId, targetType: 'post', targetId: post.id } } }) : null,
    userId ? prisma.savedItem.findUnique({ where: { userId_targetType_targetId: { userId, targetType: 'post', targetId: post.id } } }) : null,
  ]);
  return { ...post, media: jparse(post.media), roles: jparse(post.roles), commentCount, liked: !!liked, saved: !!saved };
}

// GET /api/posts  (feed)
router.get('/', optionalAuth, asyncH(async (req, res) => {
  const { skip, take, page } = pageArgs(req);
  const where = { modStatus: 'Active', ...(req.query.type ? { postType: req.query.type } : {}) };
  const [rows, total] = await Promise.all([
    prisma.post.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where }),
  ]);
  const items = await Promise.all(rows.map((p) => decorate(p, req.user?.id)));
  res.json({ items, total, page });
}));

// POST /api/posts
router.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  if (!b.postType) fail(400, 'postType required');
  const isMatch = b.postType === 'Match Challenge' || b.postType === 'Squad Recruitment';
  const post = await prisma.post.create({
    data: {
      authorId: isMatch && b.squadId ? b.squadId : req.user.id, authorType: isMatch && b.squadId ? 'squad' : 'user', squadId: b.squadId || null,
      postType: b.postType, title: b.title || null, caption: b.caption || null, sport: b.sport || null, location: b.location || req.user.profile?.location,
      image: b.image || null, media: jstr(b.media), status: b.status || (isMatch ? 'Looking for Opponent' : 'Open'),
      teamSize: b.teamSize, preferredTime: b.preferredTime, venueId: b.venueId, venueName: b.venueName, paymentSplit: b.paymentSplit,
      skillLevel: b.skillLevel, expiry: b.expiry, bookingId: b.bookingId, tacticsId: b.tacticsId, result: b.result, opponentName: b.opponentName,
      rating: b.rating, roles: jstr(b.roles), trainingType: b.trainingType, fee: b.fee,
    },
  });
  res.status(201).json({ post: await decorate(post, req.user.id) });
}));

// GET /api/posts/:id
router.get('/:id', optionalAuth, asyncH(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) fail(404, 'Post not found');
  res.json({ post: await decorate(post, req.user?.id) });
}));

// PUT /api/posts/:id
router.put('/:id', authenticate, asyncH(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) fail(404, 'Post not found');
  if (post.authorId !== req.user.id && post.squadId !== req.user.id) fail(403, 'Not your post');
  const allowed = ['title', 'caption', 'image', 'status', 'venueId', 'venueName', 'paymentSplit'];
  const data = {}; allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  res.json({ post: await prisma.post.update({ where: { id: post.id }, data }) });
}));

// DELETE /api/posts/:id
router.delete('/:id', authenticate, asyncH(async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ ok: true });
}));

// POST /api/posts/:id/like  (toggle)
router.post('/:id/like', authenticate, asyncH(async (req, res) => {
  const key = { userId: req.user.id, targetType: 'post', targetId: req.params.id };
  const existing = await prisma.like.findUnique({ where: { userId_targetType_targetId: key } });
  let liked;
  if (existing) { await prisma.like.delete({ where: { id: existing.id } }); liked = false; }
  else { await prisma.like.create({ data: key }); liked = true; }
  const post = await prisma.post.update({ where: { id: req.params.id }, data: { likes: { increment: liked ? 1 : -1 } } });
  emitTo('post:' + post.id, 'like:update', { postId: post.id, likes: post.likes, liked });
  if (liked && post.authorType === 'user' && post.authorId !== req.user.id) notify(post.authorId, { title: 'New like', message: (req.user.profile?.name || 'Someone') + ' liked your post', type: 'like', entityType: 'post', entityId: post.id }).catch(() => {});
  res.json({ liked, likes: post.likes });
}));

// POST /api/posts/:id/save  (toggle)
router.post('/:id/save', authenticate, asyncH(async (req, res) => {
  const key = { userId: req.user.id, targetType: 'post', targetId: req.params.id };
  const existing = await prisma.savedItem.findUnique({ where: { userId_targetType_targetId: key } });
  let saved;
  if (existing) { await prisma.savedItem.delete({ where: { id: existing.id } }); saved = false; }
  else { await prisma.savedItem.create({ data: key }); saved = true; }
  res.json({ saved });
}));

// POST /api/posts/:id/share
router.post('/:id/share', authenticate, asyncH(async (req, res) => {
  await prisma.shareLog.create({ data: { userId: req.user.id, targetType: 'post', targetId: req.params.id, channel: req.body.channel || 'copy' } });
  const post = await prisma.post.update({ where: { id: req.params.id }, data: { shares: { increment: 1 } } });
  res.json({ shares: post.shares });
}));

// ── Comments ──
router.get('/:id/comments', asyncH(async (req, res) => {
  const items = await prisma.comment.findMany({ where: { postId: req.params.id, status: 'Active' }, include: { replies: true }, orderBy: { createdAt: 'asc' } });
  res.json({ items, count: items.length });
}));
router.post('/:id/comments', authenticate, asyncH(async (req, res) => {
  if (!req.body.text || !req.body.text.trim()) fail(400, 'Comment text required');
  const comment = await prisma.comment.create({ data: { postId: req.params.id, userId: req.user.id, text: req.body.text.trim() } });
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  const count = await prisma.comment.count({ where: { postId: req.params.id } });
  emitTo('post:' + req.params.id, 'comment:new', { comment, count });
  if (post && post.authorType === 'user' && post.authorId !== req.user.id) notify(post.authorId, { title: 'New comment', message: (req.user.profile?.name || 'Someone') + ' commented', type: 'comment', entityType: 'post', entityId: post.id }).catch(() => {});
  res.status(201).json({ comment, count });
}));
router.post('/comments/:cid/replies', authenticate, asyncH(async (req, res) => {
  const reply = await prisma.commentReply.create({ data: { commentId: req.params.cid, userId: req.user.id, text: (req.body.text || '').trim() } });
  res.status(201).json({ reply });
}));
router.post('/comments/:cid/like', authenticate, asyncH(async (req, res) => {
  const c = await prisma.comment.update({ where: { id: req.params.cid }, data: { likes: { increment: 1 } } });
  res.json({ likes: c.likes });
}));

module.exports = router;
