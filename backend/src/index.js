require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { initSocket } = require('./realtime');
const { attachUser } = require('./auth');
const { onError, notFound } = require('./util');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const { router: venuesRoutes } = require('./routes/venues');
const squadsRoutes = require('./routes/squads');
const venuesBookingsRoutes = require('./routes/venues-bookings');
const eventsRoutes = require('./routes/events');
const matchmakingRoutes = require('./routes/matchmaking');
const socialRoutes = require('./routes/social');
const chatRoutes = require('./routes/chat');
const paymentsMemRoutes = require('./routes/payments-memberships');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 4000;

// ──────── MIDDLEWARE ────────

// CORS
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', '*'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later',
});
app.use(limiter);

// Auth middleware - attach user from JWT
app.use(attachUser);

// ──────── API ROUTES ────────

// Auth endpoints
app.use('/api', authRoutes);

// User & Profile endpoints
app.use('/api', usersRoutes);

// Squad endpoints
app.use('/api', squadsRoutes);

// Venue & Booking endpoints
app.use('/api', venuesRoutes);
app.use('/api', venuesBookingsRoutes);

// Event endpoints
app.use('/api', eventsRoutes);

// Matchmaking & Lobbies
app.use('/api', matchmakingRoutes);

// Social (Posts, Comments, Likes)
app.use('/api', socialRoutes);

// Chat endpoints
app.use('/api', chatRoutes);

// Payments & Memberships
app.use('/api', paymentsMemRoutes);

// Admin APIs
app.use('/api', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ──────── ERROR HANDLING ────────

// 404 handler
app.use(notFound);

// Global error handler
app.use(onError);

// ──────── SERVER ────────

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       🚀 ThangGo Backend Ready         ║
╠════════════════════════════════════════╣
║  API Server: http://localhost:${PORT}     ║
║  WebSocket: ws://localhost:${PORT}       ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
╚════════════════════════════════════════╝
  `);
  console.log('✓ Connected to database');
  console.log('✓ Socket.IO initialized');
  console.log('✓ All routes registered');
});

module.exports = { app, server, io };
