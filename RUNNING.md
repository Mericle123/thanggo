# ThangGo — running the full stack

ThangGo has two parts that now talk to each other:

| Folder      | What it is                                                            |
| ----------- | --------------------------------------------------------------------- |
| `server/`   | **Canonical backend** — Express + Prisma + Socket.IO, SQLite, JWT/RBAC. |
| `mobile/`   | Expo / React Native app (single `App.js`) + `mobile/src/` API client.  |
| `backend/`  | ⚠️ Older duplicate backend. Not used by the app — safe to delete.       |
| `website/`  | Empty. The admin dashboard currently lives **inside** the mobile app.  |

## 1. Start the backend

```bash
cd server
npm install          # first time only
npm run db:reset     # creates + seeds the SQLite DB (users, squads, venues, events)
npm start            # → 🟢 ThangGo API on http://localhost:4000 · Socket.IO ready
```

## 2. Start the mobile app

```bash
cd mobile
npm install          # first time only (now includes socket.io-client)
npm run web          # or: npm start  → press w / scan QR for a device
```

- **Web** auto-detects the API at `http://<same-host>:4000` (see `mobile/src/config.js`).
- **Native device/emulator:** set `NATIVE_API_HOST` in `mobile/src/config.js` to your
  machine's LAN IP (Android emulator can use `10.0.2.2`).

## Demo accounts

| Role        | Email                  | Password   |
| ----------- | ---------------------- | ---------- |
| Player      | `ngawang@thanggo.bt`   | `password` |
| Super Admin | `admin@thanggo.bt`     | `admin123` |
| Finance     | `finance@thanggo.bt`   | `admin123` |

Or tap **Register** / **Continue as guest** on the login screen — both hit the real backend
and route you through profile setup.

## What is wired to the backend right now

Real, persisted, verified end-to-end (`node /tmp/flow.mjs`-style flow passes):

- **Auth** — register, login, guest, logout, refresh, session restore (web localStorage),
  profile completion. `currentUser` throughout the app is the signed-in account.
- **Profile** — edit profile persists (`PUT /users/me/profile`).
- **Follow** — persists (toggles server-side; counts update).
- **Posts** — creating a post persists; likes/comments on your created posts persist.
- **Booking** — create persists + **locks the time slot** (it becomes `Pending`/`Booked` and
  is no longer available to others); pay → `Confirmed/Paid`; cancel releases the slot.
- **Gym membership** — apply/pay persists.
- **Payments** — settlement/match payments persist; history hydrates from the backend.
- **Notifications** — hydrate from the backend + arrive in **realtime** over Socket.IO.

## Known next phase (not yet wired)

The mobile prototype uses its own seed IDs/shapes (`u-ngawang`, `s-strikers`, `v-chang`)
that differ from the backend's cuids. So the **read** surfaces (feed list, squad/venue/event
detail screens, chat rooms, and the in-app admin dashboard) still render their local seed
data. Unifying those screens to render backend rows (an adapter mapping backend → UI shapes,
or rewriting the screens) is the next phase. Until then, those screens are a faithful demo;
every *write action* above already persists to the real database.
