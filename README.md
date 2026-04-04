# Zorvyn Backend - Financial Access Control API

A production-ready REST API for managing financial records with role-based access control (RBAC). Built with Express.js, Prisma ORM, and PostgreSQL.

## 📋 Overview

Zorvyn handles income/expense tracking with three user roles (ADMIN, ANALYST, VIEWER), JWT authentication, rate limiting, and financial dashboards.

## ✨ Key Features

- **JWT Authentication** - Token-based auth with 7-day expiry
- **RBAC System** - Three-tier role permissions (ADMIN > ANALYST > VIEWER)
- **Financial Management** - Create, read, update, delete income/expense records
- **Dashboard** - View financial summary, trends, and category breakdown
- **Rate Limiting** - 100 requests/15min (global), 20/15min (auth endpoints)
- **Swagger Docs** - Complete API documentation with test interface
- **PostgreSQL** - Secure data storage with Prisma ORM

## 🚀 Quick Setup

### Prerequisites
- Node.js v16+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

# 3. Set up database
npx prisma generate
npx prisma migrate deploy
npm run db:seed

# 4. Start server
npm run dev  # development (with auto-reload)
npm start    # production
```

Server runs on `http://localhost:4001` (or configured PORT)

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/zorvyn` |
| `JWT_SECRET` | JWT signing key (use strong key!) | `your-32-char-secret-key-here` |
| `NODE_ENV` | Environment | `development` or `production` |

## 📡 API Endpoints Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | Login and get JWT token |
| `/api/auth/me` | GET | Any | Get current user profile |
| `/api/users` | GET | ADMIN | List all users (paginated) |
| `/api/users/:id` | GET/PATCH/DELETE | ADMIN | Manage users |
| `/api/records` | GET | ANALYST, ADMIN | List financial records |
| `/api/records/:id` | GET | ANALYST, ADMIN | Get record details |
| `/api/records` | POST/PATCH/DELETE | ADMIN | Manage records |
| `/api/dashboard/summary` | GET | Any | Financial summary |
| `/api/dashboard/trends` | GET | Any | Financial trends |

## 🧪 Example Requests

### Register
```bash
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Access Protected Endpoint
```bash
curl -X GET http://localhost:4001/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🌐 Live API & Swagger

- **API Base**: http://localhost:4001 (development)
- **Swagger Docs**: http://localhost:4001/api-docs
- **Live API**: *[URL to be provided]*
- **Live Swagger**: *[URL to be provided]*

⚠️ **Note**: Not all routes are documented in Swagger. Only important and critical endpoints are included in the API documentation.

## 🛠️ Tech Stack

Node.js • Express.js • Prisma ORM • PostgreSQL • JWT • bcryptjs • Swagger

## 📁 Project Structure

```
zorvyn-backend/
├── src/
│   ├── app.js                  # Express app
│   ├── config/                 # DB & Swagger config
│   ├── controllers/            # Business logic
│   ├── middlewares/            # Auth, RBAC, rate limit
│   ├── routes/                 # API routes
│   └── utils/                  # Helper functions
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.js                 # Sample data
│   └── migrations/             # DB migrations
├── server.js                   # Entry point
└── package.json
```

## 🆘 Troubleshooting

- **Server won't start**: Check PORT availability and DATABASE_URL
- **DB connection fails**: Verify PostgreSQL is running and connection string is correct
- **Rate limit errors (429)**: Wait 15 minutes or contact admin
- **Invalid token (401)**: Tokens expire after 7 days, login again

## 📚 For Detailed Documentation

See `DOCUMENTATION.md` for:
- Complete authentication flow
- RBAC permission matrix
- Detailed API endpoints with request/response examples
- Database schema details
- Security best practices
- Error handling guide

---

**Happy coding! 🚀**
