# Thanggo Backend API

The Thanggo backend is an Express.js server with Prisma ORM and Socket.IO for real-time communication. It provides a comprehensive REST API for the Bhutan sports platform with features like user authentication, venue management, squad scheduling, and real-time messaging.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/) or use a cloud database
- **Git** (optional but recommended)

## 🗄️ Database Setup

### 1. Create a PostgreSQL Database
```bash
createdb thanggo
```
Or use pgAdmin/DBeaver GUI to create a new database named `thanggo`.

### 2. Set Up Environment Variables

Create a `.env` file in the backend root directory:

```bash
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/thanggo"

# JWT Secrets (use strong random strings in production)
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# Server Configuration
PORT=4000
NODE_ENV="development"

# File Upload (optional)
UPLOAD_DIR="uploads"
```

**Example for local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/thanggo"
```

## 🚀 Installation & Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- Express.js - Web framework
- Prisma - ORM
- Socket.IO - Real-time communication
- JWT - Authentication
- bcryptjs - Password hashing
- CORS - Cross-origin resource sharing
- Multer - File uploads
- Nodemon - Auto-reload (dev)

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Push Database Schema
```bash
npm run db:push
```

This creates all necessary tables in your PostgreSQL database based on `prisma/schema.prisma`.

### 5. (Optional) Seed the Database
```bash
npm run seed
```

This populates the database with sample data for testing.

## ▶️ Running the Backend

### Development Mode (with Auto-Reload)
```bash
npm run dev
```

The server will start and watch for file changes. Output:
```
🚀 Server running on http://localhost:4000
📡 WebSocket available at ws://localhost:4000
```

### Production Mode
```bash
npm start
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon auto-reload |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Sync database schema (creates tables if needed) |
| `npm run seed` | Populate database with sample data |
| `npm run reset` | Reset database and reseed |

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.js              # Main application entry point
│   ├── auth.js               # Authentication logic & JWT handling
│   ├── db.js                 # Prisma client initialization
│   ├── realtime.js           # Socket.IO setup & handlers
│   ├── upload.js             # File upload utilities
│   ├── util.js               # Helper functions
│   ├── helpers.js            # Database helper functions
│   └── routes/
│       ├── auth.js           # Authentication endpoints
│       ├── users.js          # User management endpoints
│       ├── venues.js         # Venue management endpoints
│       ├── squads.js         # Squad management endpoints
│       └── matches.js        # Match management endpoints
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.js               # Database seeding script
├── uploads/                  # User-uploaded files
├── .env                      # Environment variables (create this)
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔐 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users` - Search/list users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/follow` - Follow user
- `POST /api/users/:id/unfollow` - Unfollow user

### Venues
- `GET /api/venues` - List all venues
- `GET /api/venues/:id` - Get venue details
- `POST /api/venues` - Create new venue (admin)
- `PUT /api/venues/:id` - Update venue (admin)
- `DELETE /api/venues/:id` - Delete venue (admin)
- `POST /api/venues/:id/book` - Book a venue slot

### Squads
- `GET /api/squads` - List squads
- `POST /api/squads` - Create squad
- `PUT /api/squads/:id` - Update squad
- `DELETE /api/squads/:id` - Delete squad
- `POST /api/squads/:id/join` - Join squad
- `POST /api/squads/:id/leave` - Leave squad

## 🔄 Real-Time Events (Socket.IO)

The server broadcasts real-time updates:

**Client Events:**
- `join:user` - Join personal user room
- `join:room` - Join chat room
- `join:lobby` - Join lobby room
- `typing` - User is typing notification

**Server Broadcasts:**
- Updates for squad changes
- Venue booking confirmations
- Chat messages
- User status updates

## 🔒 Authentication

The backend uses JWT (JSON Web Tokens) for authentication:

- **Access Token** - Expires in 2 hours
- **Refresh Token** - Expires in 30 days
- Pass tokens via `Authorization: Bearer <token>` header

### Admin Roles

Users with these roles can access admin features:
- Admin
- Super Admin
- Moderator
- Finance Admin
- Support Staff
- Operations Admin
- Venue Manager
- Event Organizer

## 📁 File Uploads

Files are uploaded to the `uploads/` directory. Access them via:
```
http://localhost:4000/uploads/filename
```

Supported files are handled by Multer middleware in `src/upload.js`.

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Can't connect to DATABASE_URL
```
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database exists: `createdb thanggo`

### Prisma Migration Error
```bash
# Reset database (removes all data!)
npm run reset

# Or manually sync:
npm run db:push
```

### Port Already in Use
If port 4000 is taken:
```bash
# Change port in .env
PORT=5000
```

### Dependencies Installation Failed
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Nodemon Not Reloading
Check that files in `src/` are being saved properly. You can manually restart:
- In terminal, type `rs` and press Enter

## 🔧 Environment Variables Reference

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/thanggo

# JWT (Required)
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key

# Server (Optional)
PORT=4000                    # Default: 5000
NODE_ENV=development         # development or production

# File Upload (Optional)
UPLOAD_DIR=uploads           # Default: uploads
MAX_FILE_SIZE=5242880        # 5MB default
```

## 🚀 Deployment

### For Production:

1. **Use strong secrets:**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   ```

2. **Set NODE_ENV to production:**
   ```
   NODE_ENV=production
   ```

3. **Use a managed PostgreSQL service** (AWS RDS, Heroku Postgres, etc.)

4. **Deploy to platform:** Heroku, Railway, Render, AWS, DigitalOcean, etc.

## 📚 Tech Stack

| Technology | Purpose |
|-----------|---------|
| Express.js | Web framework |
| Prisma | ORM for database |
| PostgreSQL | Database |
| Socket.IO | Real-time communication |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| CORS | Cross-origin requests |
| Nodemon | Development auto-reload |

## 🤝 Mobile/Web Connection

The mobile and web apps connect to this backend at:
- **API Base:** `http://localhost:4000/api`
- **WebSocket:** `ws://localhost:4000`

Make sure to update these URLs in your mobile/web app configuration when deploying.

## 📊 Database Schema

Key tables:
- **users** - User accounts and profiles
- **squads** - Sports squads/teams
- **venues** - Sports venues/courts
- **bookings** - Venue reservations
- **chatRooms** - Messaging rooms
- **messages** - Chat messages
- **follows** - User follow relationships

See `prisma/schema.prisma` for the complete schema.

## ⚠️ Important Notes

- **Never commit `.env` file** - Add it to `.gitignore`
- **Use environment variables** for all sensitive data
- **Restart server** after changing `.env` variables
- **Run migrations** before deploying
- **Test thoroughly** on development before production

## 📝 Development Tips

1. **Check logs:** All important events are logged to console
2. **Use Prisma Studio:** `npx prisma studio` to browse database
3. **Debug mode:** Add `DEBUG=*` before running: `DEBUG=* npm run dev`
4. **API testing:** Use Postman or Insomnia to test endpoints

## 🆘 Getting Help

- Check the console output for error messages
- Verify all environment variables are set correctly
- Ensure database is running and accessible
- Check that port 4000 is not in use
- Review Prisma logs: `DATABASE_DEBUG=* npm run dev`

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Introduction](https://jwt.io/)

## 📧 Support

For issues or questions, refer to the documentation or contact the development team.

---

**Happy coding! 🎉**
