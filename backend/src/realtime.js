// Socket.IO realtime layer. Clients join rooms: user:<id>, room:<chatRoomId>, lobby:<lobbyId>.
let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', socket => {
    socket.on('join:user', userId => userId && socket.join('user:' + userId));
    socket.on('join:room', roomId => roomId && socket.join('room:' + roomId));
    socket.on('leave:room', roomId => roomId && socket.leave('room:' + roomId));
    socket.on('join:lobby', lobbyId => lobbyId && socket.join('lobby:' + lobbyId));
    socket.on('typing', ({ roomId, userId, name }) => roomId && socket.to('room:' + roomId).emit('typing', { roomId, userId, name }));
  });
  return io;
}

const emit = (channel, event, data) => { if (io) io.to(channel).emit(event, data); };
const toUser = (userId, event, data) => emit('user:' + userId, event, data);
const toRoom = (roomId, event, data) => emit('room:' + roomId, event, data);
const toLobby = (lobbyId, event, data) => emit('lobby:' + lobbyId, event, data);

module.exports = { initSocket, emit, toUser, toRoom, toLobby };
