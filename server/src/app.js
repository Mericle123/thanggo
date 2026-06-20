const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { ApiError } = require('./lib/util');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limit auth endpoints
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'thanggo-api', time: new Date().toISOString() }));

// Routers
const { notifications, reports, support, uploads } = require('./routes/misc');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/squads', require('./routes/squads'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/posts', require('./routes/social'));
app.use('/api/match', require('./routes/match'));
app.use('/api/events', require('./routes/events'));
app.use('/api/chats', require('./routes/chat'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', notifications);
app.use('/api/reports', reports);
app.use('/api/support', support);
app.use('/api/uploads', uploads);
app.use('/api/admin', require('./routes/admin'));

// 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler — secure messages
app.use((err, _req, res, _next) => {
  if (err && err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message })) });
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
  if (err && err.code === 'P2002') return res.status(409).json({ error: 'A record with that value already exists' });
  if (err && err.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  console.error('[error]', err && err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
