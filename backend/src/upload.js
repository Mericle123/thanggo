const path = require('path');
const fs = require('fs');
const multer = require('multer');

const DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + '-' + safe);
  },
});

const ALLOWED = /image\/(png|jpe?g|gif|webp|heic)|video\/(mp4|quicktime)/;
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => ALLOWED.test(file.mimetype) ? cb(null, true) : cb(new Error('Unsupported file type')),
});

const publicUrl = filename => (process.env.PUBLIC_URL || 'http://localhost:4000') + '/uploads/' + filename;

module.exports = { upload, DIR, publicUrl };
