const { prisma } = require('./prisma');

let io = null;
const setIO = (i) => { io = i; };
const getIO = () => io;
const emitTo = (room, event, data) => { if (io) io.to(room).emit(event, data); };
const emitUser = (userId, event, data) => emitTo('user:' + userId, event, data);
const emitRoom = (roomId, event, data) => emitTo('chat:' + roomId, event, data);
const emitLobby = (lobbyId, event, data) => emitTo('lobby:' + lobbyId, event, data);

// Create + push a notification in realtime.
async function notify(userId, { title, message, type, entityType, entityId }) {
  const n = await prisma.notification.create({ data: { userId, title, message: message || null, type, entityType: entityType || null, entityId: entityId || null } });
  emitUser(userId, 'notification', n);
  return n;
}

module.exports = { setIO, getIO, emitTo, emitUser, emitRoom, emitLobby, notify };
