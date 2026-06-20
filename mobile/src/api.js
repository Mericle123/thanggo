// ThangGo mobile — REST + realtime API client.
// One small module that mirrors every backend route group. All calls return parsed
// JSON and throw an Error (with the server's message) on failure, so UI code can
// `try { await api.x() } catch (e) { toast(e.message) }`.

import { API_URL, SOCKET_URL } from './config';
import { storage } from './storage';

const ACCESS_KEY = 'thanggo.access';
const REFRESH_KEY = 'thanggo.refresh';
const USER_KEY = 'thanggo.user';

let accessToken = null;
let refreshToken = null;

// ── token lifecycle ────────────────────────────────────────────────────────
export async function loadSession() {
  accessToken = await storage.get(ACCESS_KEY);
  refreshToken = await storage.get(REFRESH_KEY);
  const raw = await storage.get(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function saveSession({ accessToken: a, refreshToken: r, user }) {
  if (a) { accessToken = a; await storage.set(ACCESS_KEY, a); }
  if (r) { refreshToken = r; await storage.set(REFRESH_KEY, r); }
  if (user) await storage.set(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  accessToken = null; refreshToken = null;
  await storage.del(ACCESS_KEY); await storage.del(REFRESH_KEY); await storage.del(USER_KEY);
}

export const getToken = () => accessToken;
export const isAuthed = () => !!accessToken;

// ── core request with one-shot refresh on 401 ──────────────────────────────
async function raw(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body == null ? undefined : isForm ? body : JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    const err = new Error(msg); err.status = res.status; err.data = data; throw err;
  }
  return data;
}

async function request(path, opts = {}) {
  try {
    return await raw(path, opts);
  } catch (e) {
    // Try a single silent refresh on auth expiry, then replay.
    if (e.status === 401 && refreshToken && opts.auth !== false && path !== '/auth/refresh') {
      try {
        const r = await raw('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false });
        if (r && r.accessToken) { accessToken = r.accessToken; await storage.set(ACCESS_KEY, r.accessToken); return await raw(path, opts); }
      } catch { /* fall through */ }
    }
    throw e;
  }
}

const get = (p) => request(p);
const post = (p, body, opts) => request(p, { method: 'POST', body, ...opts });
const put = (p, body) => request(p, { method: 'PUT', body });
const del = (p) => request(p, { method: 'DELETE' });
const qs = (obj = {}) => {
  const s = Object.entries(obj).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return s ? `?${s}` : '';
};

// ── the API surface ─────────────────────────────────────────────────────────
export const api = {
  // session helpers
  loadSession, clearSession, isAuthed, getToken,

  // auth
  async register(payload) { const r = await post('/auth/register', payload, { auth: false }); await saveSession(r); return r; },
  async login(email, password) { const r = await post('/auth/login', { email, password }, { auth: false }); await saveSession(r); return r; },
  async guest() { const r = await post('/auth/guest', {}, { auth: false }); await saveSession(r); return r; },
  async completeProfile(payload) { const r = await post('/auth/complete-profile', payload); return r; },
  async me() { return get('/auth/me'); },
  async logout() { try { await post('/auth/logout', {}); } catch { /* ignore */ } await clearSession(); },
  forgot: (email) => post('/auth/forgot', { email }, { auth: false }),
  persistUser: (user) => storage.set(USER_KEY, JSON.stringify(user)),

  // users / profiles / follows
  searchUsers: (q, sport, page) => get(`/users${qs({ q, sport, page })}`),
  getUser: (id) => get(`/users/${id}`),
  updateMyProfile: (data) => put('/users/me/profile', data),
  userStats: (id) => get(`/users/${id}/stats`),
  userPosts: (id) => get(`/users/${id}/posts`),
  userLiked: (id) => get(`/users/${id}/liked`),
  userSaved: (id) => get(`/users/${id}/saved`),
  userBookings: (id) => get(`/users/${id}/bookings`),
  userPayments: (id) => get(`/users/${id}/payments`),
  userMemberships: (id) => get(`/users/${id}/memberships`),
  userSquads: (id) => get(`/users/${id}/squads`),
  follow: (targetType, targetId) => post('/users/follow', { targetType, targetId }),
  followers: (id) => get(`/users/${id}/followers`),
  following: (id) => get(`/users/${id}/following`),

  // squads
  squads: (params) => get(`/squads${qs(params)}`),
  squad: (id) => get(`/squads/${id}`),
  createSquad: (data) => post('/squads', data),
  updateSquad: (id, data) => put(`/squads/${id}`, data),
  joinRequest: (id, message) => post(`/squads/${id}/join-request`, { message }),
  joinRequests: (id) => get(`/squads/${id}/join-requests`),
  actJoinRequest: (reqId, action) => post(`/squads/join-requests/${reqId}/${action}`, {}),
  addMember: (id, userId, role) => post(`/squads/${id}/members`, { userId, role }),
  setMemberRole: (id, userId, role) => put(`/squads/${id}/members/${userId}/role`, { role }),
  removeMember: (id, userId) => del(`/squads/${id}/members/${userId}`),
  squadMembers: (id) => get(`/squads/${id}/members`),
  squadPosts: (id) => get(`/squads/${id}/posts`),

  // venues + slots + classes
  venues: (params) => get(`/venues${qs(params)}`),
  venue: (id) => get(`/venues/${id}`),
  createVenue: (data) => post('/venues', data),
  updateVenue: (id, data) => put(`/venues/${id}`, data),
  venueGallery: (id, image) => post(`/venues/${id}/gallery`, { image }),
  slots: (id, params) => get(`/venues/${id}/slots${qs(params)}`),
  reserveSlot: (id, slotId) => post(`/venues/${id}/slots/reserve`, { slotId }),
  releaseSlot: (id, slotId) => post(`/venues/${id}/slots/release`, { slotId }),
  setSlotStatus: (id, slotId, status) => put(`/venues/${id}/slots/status`, { slotId, status }),
  venueClasses: (id) => get(`/venues/${id}/classes`),

  // bookings + memberships
  createBooking: (data) => post('/bookings', data),
  myBookings: () => get('/bookings'),
  booking: (id) => get(`/bookings/${id}`),
  payBooking: (id, method) => post(`/bookings/${id}/pay`, { method }),
  cancelBooking: (id) => post(`/bookings/${id}/cancel`, {}),
  completeBooking: (id) => post(`/bookings/${id}/complete`, {}),
  bookingToChallenge: (id, data) => post(`/bookings/${id}/create-challenge`, data || {}),
  applyMembership: (data) => post('/bookings/memberships', data),
  myMemberships: () => get('/bookings/memberships/mine'),
  activateMembership: (id) => post(`/bookings/memberships/${id}/activate`, {}),

  // posts (social)
  feed: (params) => get(`/posts${qs(params)}`),
  post: (id) => get(`/posts/${id}`),
  createPost: (data) => post('/posts', data),
  updatePost: (id, data) => put(`/posts/${id}`, data),
  deletePost: (id) => del(`/posts/${id}`),
  likePost: (id) => post(`/posts/${id}/like`, {}),
  savePost: (id) => post(`/posts/${id}/save`, {}),
  sharePost: (id) => post(`/posts/${id}/share`, {}),
  comments: (id) => get(`/posts/${id}/comments`),
  addComment: (id, text) => post(`/posts/${id}/comments`, { text }),
  addReply: (cid, text) => post(`/posts/comments/${cid}/replies`, { text }),
  likeComment: (cid) => post(`/posts/comments/${cid}/like`, {}),

  // matchmaking + lobbies + tactics
  matchPosts: (params) => get(`/match/posts${qs(params)}`),
  challengers: (params) => get(`/match/challengers${qs(params)}`),
  sendMatchRequest: (data) => post('/match/requests', data),
  postRequests: (postId) => get(`/match/posts/${postId}/requests`),
  acceptRequest: (id) => post(`/match/requests/${id}/accept`, {}),
  rejectRequest: (id) => post(`/match/requests/${id}/reject`, {}),
  lobby: (id) => get(`/match/lobbies/${id}`),
  lobbyReady: (id, ready) => post(`/match/lobbies/${id}/ready`, { ready }),
  lobbyConfirmLineup: (id, side) => post(`/match/lobbies/${id}/confirm-lineup`, { side }),
  lobbyAcceptTerms: (id, side) => post(`/match/lobbies/${id}/accept-terms`, { side }),
  lobbyPay: (id) => post(`/match/lobbies/${id}/pay`, {}),
  lobbyLock: (id) => post(`/match/lobbies/${id}/lock`, {}),
  lobbyComplete: (id, result) => post(`/match/lobbies/${id}/complete`, { result }),
  lobbyCancel: (id) => post(`/match/lobbies/${id}/cancel`, {}),
  createTactics: (data) => post('/match/tactics', data),
  tactics: (id) => get(`/match/tactics/${id}`),
  updateTactics: (id, data) => put(`/match/tactics/${id}`, data),
  lockTactics: (id) => post(`/match/tactics/${id}/lock`, {}),

  // events
  events: (params) => get(`/events${qs(params)}`),
  event: (id) => get(`/events/${id}`),
  createEvent: (data) => post('/events', data),
  publishEvent: (id) => post(`/events/${id}/publish`, {}),
  cancelEvent: (id) => post(`/events/${id}/cancel`, {}),
  registerEvent: (id, data) => post(`/events/${id}/register`, data),
  eventRegistrations: (id) => get(`/events/${id}/registrations`),
  actRegistration: (id, action) => post(`/events/registrations/${id}/${action}`, {}),

  // chat
  chatRooms: () => get('/chats'),
  createRoom: (data) => post('/chats/rooms', data),
  directRoom: (userId) => post(`/chats/direct/${userId}`, {}),
  messages: (roomId) => get(`/chats/rooms/${roomId}/messages`),
  sendMessage: (roomId, text) => post(`/chats/rooms/${roomId}/messages`, { text }),
  markRoomRead: (roomId) => post(`/chats/rooms/${roomId}/read`, {}),

  // payments
  payments: () => get('/payments'),
  payment: (id) => get(`/payments/${id}`),
  createPayment: (data) => post('/payments', data),
  payPayment: (id, method) => post(`/payments/${id}/pay`, { method }),
  refundPayment: (id) => post(`/payments/${id}/refund`, {}),
  disputePayment: (id, reason) => post(`/payments/${id}/dispute`, { reason }),
  lobbySplit: (lobbyId) => get(`/payments/lobbies/${lobbyId}/split`),
  settleLobby: (lobbyId) => post(`/payments/lobbies/${lobbyId}/settle`, {}),

  // notifications
  notifications: () => get('/notifications'),
  markNotifRead: (id) => post(`/notifications/${id}/read`, {}),
  markAllNotifsRead: () => post('/notifications/read-all', {}),
  deleteNotif: (id) => del(`/notifications/${id}`),

  // reports + support
  report: (data) => post('/reports', data),
  myReports: () => get('/reports/mine'),
  createTicket: (data) => post('/support', data),
  myTickets: () => get('/support/mine'),

  // uploads
  uploadUrl: () => `${API_URL}/uploads`,

  // admin
  admin: {
    dashboard: () => get('/admin/dashboard'),
    users: () => get('/admin/users'),
    setUserStatus: (id, status) => post(`/admin/users/${id}/status`, { status }),
    verifyUser: (id) => post(`/admin/users/${id}/verify`, {}),
    venues: () => get('/admin/venues'),
    venueApplications: () => get('/admin/venue-applications'),
    setVenueStatus: (id, status) => post(`/admin/venues/${id}/status`, { status }),
    squads: () => get('/admin/squads'),
    setSquadStatus: (id, status) => post(`/admin/squads/${id}/status`, { status }),
    bookings: () => get('/admin/bookings'),
    actBooking: (id, action) => post(`/admin/bookings/${id}/${action}`, {}),
    posts: () => get('/admin/posts'),
    modPost: (id, mod) => post(`/admin/posts/${id}/mod`, { mod }),
    removePost: (id) => del(`/admin/posts/${id}`),
    comments: () => get('/admin/comments'),
    payments: () => get('/admin/payments'),
    refundPayment: (id) => post(`/admin/payments/${id}/refund`, {}),
    markPaid: (id) => post(`/admin/payments/${id}/mark-paid`, {}),
    memberships: () => get('/admin/memberships'),
    setMembershipStatus: (id, status) => post(`/admin/memberships/${id}/status`, { status }),
    reports: () => get('/admin/reports'),
    setReportStatus: (id, status) => post(`/admin/reports/${id}/status`, { status }),
    tickets: () => get('/admin/tickets'),
    updateTicket: (id, data) => post(`/admin/tickets/${id}`, data),
    lobbies: () => get('/admin/lobbies'),
    actLobby: (id, action) => post(`/admin/lobbies/${id}/${action}`, {}),
    announce: (data) => post('/admin/announcements', data),
    logs: () => get('/admin/logs'),
    analytics: () => get('/admin/analytics'),
  },
};

// ── realtime (Socket.IO) ─────────────────────────────────────────────────────
let socket = null;
const listeners = new Map(); // event -> Set<cb>

export function connectSocket() {
  if (socket || !accessToken) return socket;
  let ioClient;
  try { ioClient = require('socket.io-client').io || require('socket.io-client'); } catch { return null; }
  try {
    socket = ioClient(SOCKET_URL, { auth: { token: accessToken }, transports: ['websocket', 'polling'] });
    // re-dispatch to registered listeners
    socket.onAny && socket.onAny((event, payload) => {
      const set = listeners.get(event);
      if (set) set.forEach((cb) => { try { cb(payload); } catch { /* ignore */ } });
    });
  } catch { socket = null; }
  return socket;
}

export function disconnectSocket() {
  try { socket && socket.disconnect(); } catch { /* ignore */ }
  socket = null;
}

export function joinRoom(room) { try { socket && socket.emit('join', room); } catch { /* ignore */ } }
export function leaveRoom(room) { try { socket && socket.emit('leave', room); } catch { /* ignore */ } }
export function emitTyping(roomId, userId) { try { socket && socket.emit('typing', { roomId, userId }); } catch { /* ignore */ } }

export function onSocket(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  return () => { const s = listeners.get(event); if (s) s.delete(cb); };
}

export default api;
