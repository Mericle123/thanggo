// ThangGo mobile — runtime config.
// The mobile app talks to the ThangGo backend (server/) over REST + Socket.IO.
//
// • On web (Expo web / the built dist), we auto-detect the host the page is served
//   from and talk to that host on port 4000 — so it works on localhost and on a LAN.
// • On native (iOS/Android), set NATIVE_API_HOST to your dev machine's LAN IP
//   (e.g. "192.168.1.20") so a physical device / emulator can reach the server.
//   Android emulator can use "10.0.2.2"; iOS simulator can use "localhost".

const API_PORT = 4000;

// Change this for native device testing (LAN IP of the machine running `npm start` in server/).
// Set to this Mac's LAN/hotspot IP so a physical phone in Expo Go can reach the backend.
export const NATIVE_API_HOST = '172.20.10.5';

function detectBase() {
  // Web: derive from the current location.
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${API_PORT}`;
  }
  // Native fallback.
  return `http://${NATIVE_API_HOST}:${API_PORT}`;
}

export const API_BASE = detectBase();
export const API_URL = `${API_BASE}/api`;
export const SOCKET_URL = API_BASE;
