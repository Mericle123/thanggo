// notifications, reports, support, uploads
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { prisma } = require('../lib/prisma');
const { asyncH, fail } = require('../lib/util');
const { authenticate } = require('../middleware/auth');

// ── Notifications ──
const notifications = express.Router();
notifications.get('/', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 }), unread: await prisma.notification.count({ where: { userId: req.user.id, read: false } }) })));
notifications.post('/:id/read', authenticate, asyncH(async (req, res) => res.json({ notification: await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } }) })));
notifications.post('/read-all', authenticate, asyncH(async (req, res) => { await prisma.notification.updateMany({ where: { userId: req.user.id }, data: { read: true } }); res.json({ ok: true }); }));
notifications.delete('/:id', authenticate, asyncH(async (req, res) => { await prisma.notification.delete({ where: { id: req.params.id } }).catch(() => {}); res.json({ ok: true }); }));

// ── Reports ──
const reports = express.Router();
reports.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  if (!b.type || !b.targetId) fail(400, 'type and targetId required');
  res.status(201).json({ report: await prisma.report.create({ data: { reporterId: req.user.id, type: b.type, targetType: b.targetType, targetId: b.targetId, reason: b.reason, priority: b.priority || 'Medium' } }) });
}));
reports.get('/mine', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.report.findMany({ where: { reporterId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));

// ── Support ──
const support = express.Router();
support.post('/', authenticate, asyncH(async (req, res) => {
  const b = req.body;
  res.status(201).json({ ticket: await prisma.supportTicket.create({ data: { userId: req.user.id, subject: b.subject, category: b.category || 'Other', priority: b.priority || 'Medium' } }) });
}));
support.get('/mine', authenticate, asyncH(async (req, res) => res.json({ items: await prisma.supportTicket.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }) })));

// ── Uploads ──
const uploads = express.Router();
const dir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname || '.bin')),
});
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ALLOWED.includes(file.mimetype)) });
uploads.post('/', authenticate, upload.single('file'), asyncH(async (req, res) => {
  if (!req.file) fail(400, 'No file uploaded (field "file", allowed: jpg/png/webp/gif/mp4 ≤25MB)');
  res.status(201).json({ url: `/uploads/${req.file.filename}`, type: req.file.mimetype.startsWith('video') ? 'video' : 'image' });
}));
uploads.delete('/:filename', authenticate, asyncH(async (req, res) => { const f = path.join(dir, path.basename(req.params.filename)); fs.existsSync(f) && fs.unlinkSync(f); res.json({ ok: true }); }));

module.exports = { notifications, reports, support, uploads };
