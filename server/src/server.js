require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { setIO } = require('./lib/realtime');
const { verifyAccess } = require('./lib/util');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
setIO(io);

io.on('connection', (socket) => {
  // Authenticate the socket (optional) and auto-join the user room.
  const token = socket.handshake.auth?.token;
  if (token) { try { const p = verifyAccess(token); socket.userId = p.id; socket.join('user:' + p.id); } catch { /* anonymous */ } }
  socket.on('join', (room) => room && socket.join(room));            // e.g. chat:<id>, lobby:<id>, venue:<id>, post:<id>
  socket.on('leave', (room) => room && socket.leave(room));
  socket.on('typing', ({ roomId, userId }) => roomId && socket.to('chat:' + roomId).emit('typing', { roomId, userId }));
});

server.listen(PORT, () => {
  console.log(`🟢 ThangGo API on http://localhost:${PORT}  ·  Socket.IO ready`);
});

module.exports = server;
