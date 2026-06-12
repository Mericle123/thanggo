# ThangGo Backend API Documentation

## Overview

ThangGo is a comprehensive backend system for a premium sports platform in Bhutan. Built with Express.js, Prisma ORM, SQLite/PostgreSQL, Socket.IO, and JWT authentication.

**Base URL:** `http://localhost:4000/api`  
**WebSocket URL:** `ws://localhost:4000`

## Quick Start

### 1. Setup

```bash
cd backend
npm install
npm run db:push
npm run seed
npm run dev
```

### 2. Test Authentication

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ngawang@thanggo.app",
    "password": "password123"
  }'

# Use returned accessToken in subsequent requests
# Authorization: Bearer <accessToken>
```

---

## Authentication Endpoints

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name",
  "username": "username"
}

Response: { accessToken, refreshToken, user }
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: { accessToken, refreshToken, user }
```

### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}

Response: { accessToken }
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response: { logged_out: true }
```

---

## User & Profile Endpoints

### Get User Profile
```
GET /api/users/:id/profile
Response: { user, stats }
```

### Edit Profile
```
PUT /api/users/:id/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "Bio text",
  "location": "Thimphu",
  "mainSport": "Football",
  "skillLevel": "Advanced",
  "profileComplete": true
}

Response: { user }
```

### Upload Profile Photo
```
POST /api/users/:id/photo
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "photoUrl": "https://example.com/photo.jpg"
}

Response: { photo }
```

### Follow User
```
POST /api/users/:id/follow
Authorization: Bearer <accessToken>

Response: { following: true }
```

### Get Followers
```
GET /api/users/:id/followers?page=1&limit=20

Response: [users...]
```

### Get Following
```
GET /api/users/:id/following?page=1&limit=20

Response: [users...]
```

### Search Users
```
GET /api/users?q=name&sport=Football&location=Thimphu&page=1&limit=20

Response: [users...]
```

---

## Squad Endpoints

### Create Squad
```
POST /api/squads
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Team Name",
  "sport": "Football",
  "handle": "team-handle",
  "location": "Thimphu",
  "skillLevel": "Advanced",
  "description": "Team description"
}

Response: { squad }
```

### Get Squad Details
```
GET /api/squads/:id

Response: {
  squad,
  members: [{ user, role, sportRole }...],
  memberCount
}
```

### Edit Squad (Captain only)
```
PUT /api/squads/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "New Name",
  "description": "New description",
  "logo": "https://...",
  "banner": "https://..."
}

Response: { squad }
```

### Invite Player
```
POST /api/squads/:id/members
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "userId": "player-id"
}

Response: { joinRequest }
```

### Accept Join Request (Captain only)
```
POST /api/squads/:id/join-requests/:requestId/accept
Authorization: Bearer <accessToken>

Response: { status: "accepted" }
```

### Assign Role
```
POST /api/squads/:id/members/:userId/assign-role
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "role": "Vice Captain" // or "Player", "Substitute", "Coach/Manager"
}

Response: { member }
```

### Leave Squad
```
POST /api/squads/:id/leave
Authorization: Bearer <accessToken>

Response: { left: true }
```

### Search Squads
```
GET /api/squads?q=name&sport=Football&location=Thimphu&page=1

Response: [squads...]
```

### Follow Squad
```
POST /api/squads/:id/follow
Authorization: Bearer <accessToken>

Response: { following: true }
```

---

## Venue & Booking Endpoints

### Create Venue (Owner)
```
POST /api/venues
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Venue Name",
  "venueType": "Court", // "Ground", "Gym", etc.
  "location": "Thimphu",
  "sports": ["Football", "Badminton"],
  "facilities": ["Parking", "Changing Room"],
  "pricePerHour": 600
}

Response: { venue }
```

### Get Venue Details
```
GET /api/venues/:id

Response: {
  ...venue,
  sports: [],
  facilities: [],
  gallery: [],
  slots: []
}
```

### Search Venues
```
GET /api/venues?q=name&sport=Football&type=Court&location=Thimphu

Response: [venues...]
```

### Upload Gallery Image
```
POST /api/venues/:id/gallery
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "url": "https://example.com/image.jpg",
  "caption": "Image description"
}

Response: { venue }
```

### Get Available Time Slots
```
GET /api/timeslots?venueId=venue-id&date=2026-06-15&sport=Football

Response: [
  { time: "18:00", status: "Available", price: 600 },
  { time: "19:00", status: "Booked", price: 600 }
]
```

### Create Booking
```
POST /api/bookings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "venueId": "venue-id",
  "date": "2026-06-15",
  "slot": "18:00",
  "sport": "Football",
  "participants": 11,
  "bookingType": "Court Booking"
}

Response: { booking }
```

### Confirm Booking
```
PUT /api/bookings/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Confirmed",
  "paymentStatus": "Paid"
}

Response: { booking }
```

### Cancel Booking
```
POST /api/bookings/:id/cancel
Authorization: Bearer <accessToken>

Response: { booking }
```

---

## Gym Memberships

### Apply for Membership
```
POST /api/memberships
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "venueId": "gym-id",
  "plan": "Monthly",
  "period": "1 month",
  "price": 1500,
  "startDate": "2026-06-12"
}

Response: { membership }
```

### Renew Membership
```
PUT /api/memberships/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Active"
}

Response: { membership }
```

### Cancel Membership
```
POST /api/memberships/:id/cancel
Authorization: Bearer <accessToken>

Response: { membership }
```

---

## Match Challenges & Lobbies

### Create Match Challenge Post
```
POST /api/match-posts
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "sport": "Football",
  "title": "Looking for opponent",
  "caption": "Experienced team seeking friendly match",
  "location": "Thimphu",
  "teamSize": "11",
  "skillLevel": "Advanced",
  "venueId": "venue-id",
  "image": "https://...",
  "paymentSplit": "50/50 Team Split"
}

Response: { matchPost }
```

### Get Match Feed
```
GET /api/match-posts?sport=Football&skillLevel=Advanced&page=1

Response: [matchPosts...]
```

### Request to Compete
```
POST /api/match-requests
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "postId": "post-id",
  "requestingSquadId": "squad-id",
  "message": "We're interested!"
}

Response: { matchRequest }
```

### Accept Request (Creates Lobby)
```
POST /api/match-requests/:id/accept
Authorization: Bearer <accessToken>

Response: { lobby, chatRoom }
```

### Get Lobby
```
GET /api/lobbies/:id

Response: { lobby }
```

### Confirm Lineup
```
PUT /api/lobbies/:id/lineup
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "teamId": "squad-id",
  "lineup": [...]
}

Response: { lobby }
```

### Accept Payment Terms
```
PUT /api/lobbies/:id/payment
Authorization: Bearer <accessToken>

Response: { lobby }
```

### Lock Match (Final step)
```
POST /api/lobbies/:id/lock
Authorization: Bearer <accessToken>

Response: { lobby }
```

### Complete Match
```
POST /api/lobbies/:id/complete
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "result": "Team A 3 - 2 Team B",
  "winnerTeamId": "squad-id"
}

Response: { lobby }
```

---

## Tactics

### Create Tactics Plan
```
POST /api/tactics
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "ownerKind": "squad",
  "ownerId": "squad-id",
  "name": "4-4-2 Formation",
  "sport": "Football",
  "formation": "4-4-2",
  "roster": ["player1", "player2"...],
  "roles": { "player1": "Goalkeeper" },
  "positions": { "player1": { "x": 50, "y": 10 } }
}

Response: { tactics }
```

### Update Tactics
```
PUT /api/tactics/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "formation": "3-5-2",
  "roster": [...],
  "positions": {...}
}

Response: { tactics }
```

### Lock Tactics (Captain only)
```
POST /api/tactics/:id/lock
Authorization: Bearer <accessToken>

Response: { tactics }
```

---

## Social Features

### Create Post
```
POST /api/posts
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "postType": "Match Challenge",
  "sport": "Football",
  "title": "Post title",
  "caption": "Post caption",
  "image": "https://..."
}

Response: { post }
```

### Get Post Detail
```
GET /api/posts/:id

Response: {
  ...post,
  likesCount,
  commentsCount
}
```

### Get Posts Feed
```
GET /api/posts?postType=Match Challenge&sport=Football&page=1

Response: [posts...]
```

### Like/Unlike Post
```
POST /api/likes
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "targetType": "post",
  "targetId": "post-id"
}

Response: { liked: boolean, count }
```

### Add Comment
```
POST /api/comments
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "postId": "post-id",
  "text": "Great post!",
  "parentId": null // for replies
}

Response: { comment }
```

### Get Comments
```
GET /api/posts/:id/comments

Response: [comments...]
```

### Save Post
```
POST /api/saves
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "targetType": "post",
  "targetId": "post-id"
}

Response: { saved: boolean }
```

---

## Events

### Create Event
```
POST /api/events
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Weekend Futsal Tournament",
  "sport": "Futsal",
  "eventType": "Tournament",
  "location": "Thimphu",
  "date": "2026-06-20",
  "deadline": "2026-06-18",
  "capacity": 8,
  "fee": "2000"
}

Response: { event }
```

### Register for Event
```
POST /api/events/:id/register
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "kind": "squad", // or "individual"
  "squadId": "squad-id",
  "members": [...]
}

Response: { registration }
```

### Search Events
```
GET /api/events?q=tournament&sport=Football&status=Registration Open

Response: [events...]
```

---

## Payments

### Create Payment
```
POST /api/payments
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "purpose": "Venue Booking",
  "amount": 600,
  "refType": "booking",
  "refId": "booking-id"
}

Response: { payment }
```

### Confirm Payment (Mark as Paid)
```
PUT /api/payments/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Paid"
}

Response: { payment }
```

### Get User Payments
```
GET /api/users/:id/payments?page=1

Authorization: Bearer <accessToken>

Response: [payments...]
```

---

## Notifications

### Get Notifications
```
GET /api/notifications?page=1&limit=20

Authorization: Bearer <accessToken>

Response: [notifications...]
```

### Mark as Read
```
PUT /api/notifications/:id

Authorization: Bearer <accessToken>

Response: { notification }
```

### Mark All as Read
```
POST /api/notifications/mark-all-read

Authorization: Bearer <accessToken>

Response: { marked: true }
```

---

## Chat (Real-time)

### Create Chat Room
```
POST /api/chats
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "type": "squad", // "direct", "lobby", "event"
  "title": "Squad Chat",
  "members": ["user1", "user2"],
  "refId": "squad-id"
}

Response: { room }
```

### Get Messages
```
GET /api/chats/:roomId/messages?page=1&limit=50

Authorization: Bearer <accessToken>

Response: [messages...]
```

### Send Message (REST)
```
POST /api/chats/:roomId/messages
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "text": "Message text"
}

Response: { message }
```

### WebSocket Events (Real-time)
```
// Connect to ws://localhost:4000
socket.on('join:lobby', lobbyId => {...})
socket.on('join:squad', squadId => {...})
socket.emit('message', { roomId, text })
socket.on('message', data => {...})
```

---

## Admin Endpoints

### Admin Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "ngawang@thanggo.app",
  "password": "password123"
}

Response: { accessToken, user (with role: "Super Admin") }
```

### Get Dashboard Stats
```
GET /api/admin/dashboard

Authorization: Bearer <accessToken>

Response: {
  users,
  venues,
  bookings,
  payments,
  revenue,
  events,
  openReports
}
```

### Suspend/Ban User
```
PUT /api/admin/users/:id

Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Suspended" // or "Banned", "Active"
}

Response: { user }
```

### Approve Venue
```
PUT /api/admin/venues/:id/approve

Authorization: Bearer <accessToken>

Response: { venue }
```

### Get Reports
```
GET /api/admin/reports?status=Open&page=1

Authorization: Bearer <accessToken>

Response: [reports...]
```

### Moderate Post
```
PUT /api/admin/posts/:id/moderate

Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Hidden" // or "Active", "Removed"
}

Response: { post }
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Common HTTP Status Codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not authorized for action
- `404 Not Found` - Resource not found
- `500 Server Error` - Internal error

---

## Testing the Complete Flow

### 1. Auth Flow
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass","name":"Test","username":"test"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Copy accessToken
TOKEN="your-token-here"
```

### 2. Profile Flow
```bash
# Edit profile
curl -X PUT http://localhost:4000/api/users/user-id/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","location":"Thimphu","profileComplete":true}'
```

### 3. Squad Flow
```bash
# Create squad
curl -X POST http://localhost:4000/api/squads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Squad","sport":"Football"}'

# Get squad
curl http://localhost:4000/api/squads/squad-id
```

### 4. Booking Flow
```bash
# Get venues
curl http://localhost:4000/api/venues?location=Thimphu

# Get time slots
curl "http://localhost:4000/api/timeslots?venueId=venue-id&date=2026-06-15"

# Create booking
curl -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId":"venue-id",
    "date":"2026-06-15",
    "slot":"18:00",
    "sport":"Football",
    "participants":11
  }'

# Confirm booking
curl -X PUT http://localhost:4000/api/bookings/booking-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Confirmed","paymentStatus":"Paid"}'
```

---

## Rate Limiting

All endpoints are rate-limited to:
- **1000 requests per 15 minutes** per IP address

Exceeding this limit returns `429 Too Many Requests`.

---

## Authentication

Include JWT token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Tokens expire in:
- **Access Token:** 2 hours
- **Refresh Token:** 30 days

---

## Deployment Notes

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Use strong JWT secrets
4. Enable HTTPS
5. Set CORS origins appropriately
6. Configure proper file storage (S3, etc.)
7. Setup proper logging and monitoring

---

## Support

For issues or questions, refer to the main README or contact the development team.
