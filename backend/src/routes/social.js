// Social Posts, Comments, Likes APIs
const router = require('express').Router();
const prisma = require('../db');
const { ah, boom, paginate, J, S } = require('../util');
const { requireAuth } = require('../auth');

// ──────── POSTS ────────

// POST /api/posts (create)
router.post('/posts', requireAuth, ah(async (req, res) => {
  const { postType, sport, title, caption, image, media } = req.body;
  if (!postType) throw boom(400, 'postType required');
  
  const post = await prisma.post.create({
    data: {
      authorType: 'user',
      createdBy: req.user.id,
      postType,
      sport,
      title,
      caption,
      image,
      media: S(media || []),
      modStatus: 'Active',
    },
  });
  
  res.status(201).json(post);
}));

// GET /api/posts/:id
router.get('/posts/:id', ah(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw boom(404, 'Post not found');
  
  const likes = await prisma.like.count({ where: { targetId: post.id, targetType: 'post' } });
  const comments = await prisma.comment.count({ where: { postId: post.id, modStatus: 'Active' } });
  
  res.json({
    ...post,
    media: J(post.media, []),
    likesCount: likes + post.likesBase,
    commentsCount: comments,
  });
}));

// GET /api/posts (feed)
router.get('/posts', ah(async (req, res) => {
  const { skip, take } = paginate(req);
  const { postType, sport } = req.query;
  
  const where = { modStatus: 'Active' };
  if (postType) where.postType = postType;
  if (sport) where.sport = sport;
  
  const posts = await prisma.post.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(posts.map(p => ({
    ...p,
    media: J(p.media, []),
  })));
}));

// PUT /api/posts/:id (edit)
router.put('/posts/:id', requireAuth, ah(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || post.createdBy !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      title: req.body.title,
      caption: req.body.caption,
    },
  });
  
  res.json(updated);
}));

// DELETE /api/posts/:id
router.delete('/posts/:id', requireAuth, ah(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || post.createdBy !== req.user.id) throw boom(403, 'Not authorized');
  
  await prisma.post.update({
    where: { id: req.params.id },
    data: { modStatus: 'Hidden' },
  });
  
  res.json({ deleted: true });
}));

// ──────── LIKES ────────

// POST /api/likes (toggle like)
router.post('/likes', requireAuth, ah(async (req, res) => {
  const { targetType, targetId } = req.body;
  if (!targetType || !targetId) throw boom(400, 'targetType and targetId required');
  
  const existing = await prisma.like.findUnique({
    where: { userId_targetType_targetId: { userId: req.user.id, targetType, targetId } },
  }).catch(() => null);
  
  let liked = false;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId: req.user.id, targetType, targetId },
    });
    liked = true;
  }
  
  const count = await prisma.like.count({ where: { targetType, targetId } });
  res.json({ liked, count });
}));

// GET /api/posts/:id/likes
router.get('/posts/:id/likes', ah(async (req, res) => {
  const likes = await prisma.like.findMany({
    where: { targetId: req.params.id, targetType: 'post' },
  });
  res.json({ likes });
}));

// ──────── COMMENTS ────────

// POST /api/comments (add comment)
router.post('/comments', requireAuth, ah(async (req, res) => {
  const { postId, text, parentId } = req.body;
  if (!postId || !text) throw boom(400, 'postId and text required');
  
  const comment = await prisma.comment.create({
    data: {
      postId,
      userId: req.user.id,
      text,
      parentId,
      modStatus: 'Active',
    },
  });
  
  // Notify post creator
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.createdBy !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.createdBy,
        type: 'new_comment',
        title: 'New Comment',
        body: req.user.name + ' commented on your post',
        entityType: 'post',
        entityId: postId,
      },
    });
  }
  
  res.status(201).json(comment);
}));

// GET /api/posts/:id/comments
router.get('/posts/:id/comments', ah(async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id, modStatus: 'Active' },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json(comments);
}));

// PUT /api/comments/:id
router.put('/comments/:id', requireAuth, ah(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment || comment.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  const updated = await prisma.comment.update({
    where: { id: req.params.id },
    data: { text: req.body.text },
  });
  
  res.json(updated);
}));

// DELETE /api/comments/:id
router.delete('/comments/:id', requireAuth, ah(async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment || comment.userId !== req.user.id) throw boom(403, 'Not authorized');
  
  await prisma.comment.update({
    where: { id: req.params.id },
    data: { modStatus: 'Hidden' },
  });
  
  res.json({ deleted: true });
}));

// ──────── SAVES ────────

// POST /api/saves (toggle save)
router.post('/saves', requireAuth, ah(async (req, res) => {
  const { targetType, targetId } = req.body;
  
  const existing = await prisma.savedItem.findUnique({
    where: { userId_targetType_targetId: { userId: req.user.id, targetType, targetId } },
  }).catch(() => null);
  
  let saved = false;
  if (existing) {
    await prisma.savedItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedItem.create({
      data: { userId: req.user.id, targetType, targetId },
    });
    saved = true;
  }
  
  res.json({ saved });
}));

// GET /api/users/:id/saved-posts
router.get('/users/:id/saved-posts', requireAuth, ah(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'Admin') throw boom(403, 'Not authorized');
  
  const saved = await prisma.savedItem.findMany({
    where: { userId: req.params.id, targetType: 'post' },
  });
  
  const posts = saved.length
    ? await prisma.post.findMany({ where: { id: { in: saved.map(s => s.targetId) } } })
    : [];
  
  res.json(posts);
}));

module.exports = router;
