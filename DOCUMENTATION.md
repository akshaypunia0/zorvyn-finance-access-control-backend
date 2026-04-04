# Zorvyn Backend - Technical Documentation

## 🏗️ System Architecture

```
Client/Frontend
    ↓ (HTTP)
Express.js Server (Port 4001)
    ├─ CORS & Body Parser
    ├─ Rate Limiter (Global: 100/15min, Auth: 20/15min)
    ├─ Auth Middleware (JWT validation)
    ├─ RBAC Middleware (Role check)
    └─ Route Handlers
    ↓
Prisma ORM
    ↓ (PostgreSQL Protocol)
PostgreSQL Database
    ├─ Users table
    └─ FinancialRecords table
```

## 🔐 Authentication Flow

### JWT Token Flow

1. **Register/Login** → User provides credentials
2. **Password Hash** → bcryptjs hashes password (10 rounds)
3. **Token Generation** → Server signs JWT with secret key
   - **Header**: `{ alg: "HS256", typ: "JWT" }`
   - **Payload**: `{ id, email, role, iat, exp }`
   - **Expiry**: 7 days
4. **Token Delivery** → Returned in response body + HTTP-only cookie
5. **Token Usage** → Client sends in `Authorization: Bearer {token}` or cookie
6. **Verification** → Server validates signature, checks expiry, verifies user exists and is active

### Token Validation Steps

```
Request arrives
    ↓
Extract token (header or cookie)
    ├─ Not found? → 401 Unauthorized
    ↓
Verify signature and expiry
    ├─ Invalid/Expired? → 401 Unauthorized
    ↓
Decode payload → Get user ID
    ↓
Query database for user
    ├─ Not found? → 401 Unauthorized
    ├─ Status != ACTIVE? → 403 Forbidden
    ↓
✓ Proceed to controller
```

## 👥 Role-Based Access Control (RBAC)

### Role Hierarchy

```
ADMIN (Full Access)
  ├─ Manage users (CRUD)
  ├─ Manage records (CRUD)
  └─ View dashboard/trends

ANALYST (Read-Only + Stats)
  ├─ List/view records
  ├─ View dashboard/trends
  └─ Cannot create/edit records

VIEWER (Read Dashboard Only)
  ├─ View dashboard summary
  ├─ View trends
  └─ Cannot see record details
```

### Permission Matrix

| Feature | VIEWER | ANALYST | ADMIN |
|---------|--------|---------|-------|
| Authentication | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ |
| View Records | ✗ | ✓ | ✓ |
| Create/Edit Records | ✗ | ✗ | ✓ |
| Delete Records | ✗ | ✗ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |

### Implementation

```javascript
// Routes use composition: auth → RBAC → controller
router.post('/records',
  authMiddleware,                    // Verify token
  requireRoles(ROLES.ADMIN),         // Check role
  createRecord                       // Execute
);
```

## 🛡️ Rate Limiting

Two-tier rate limiting strategy:

| Type | Limit | Window | Purpose |
|------|-------|--------|---------|
| **Global** | 100 req | 15 min | All endpoints |
| **Auth** | 20 req | 15 min | Login/register only |

Response headers include:
```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1681234567
```

When limit exceeded: **HTTP 429** with message requesting retry after window resets.

## 📡 Detailed API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
```json
Request:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+919876543210"
}

Response (201):
{
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "VIEWER",
    "status": "ACTIVE"
  },
  "token": "eyJhbGc..."
}

Errors: 400 (validation), 409 (email exists), 429 (rate limited)
```

#### POST /api/auth/login
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200): Same as register but message = "Login successful"
Errors: 400, 401 (invalid creds), 403 (inactive), 429
```

#### GET /api/auth/me
Returns current authenticated user profile. Errors: 401 (invalid token)

### User Management (ADMIN only)

#### GET /api/users?page=1&limit=20
Returns paginated user list with pagination metadata.

#### POST /api/users
```json
Request:
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass456!",
  "role": "ANALYST",
  "status": "ACTIVE"
}
```

#### PATCH /api/users/:id
Update user (fullName, role, status, phone).

#### DELETE /api/users/:id
Delete user permanently.

### Financial Records (RBAC-protected)

#### GET /api/records
Query params: `page`, `limit`, `from` (date), `to` (date), `type` (INCOME/EXPENSE)
Requires: ANALYST or ADMIN

#### POST /api/records
```json
Request:
{
  "amount": 5000,
  "type": "EXPENSE",
  "category": "Office Supplies",
  "date": "2025-04-04",
  "notes": "Monthly expenses"
}
Response (201): Record created with all fields
Errors: 400 (validation), 403 (role)
```

#### PATCH /api/records/:id
Update record (amount, type, category, notes). ADMIN only.

#### DELETE /api/records/:id
Soft delete (sets deletedAt timestamp). ADMIN only.

### Dashboard Endpoints

#### GET /api/dashboard/summary
Query params: `from`, `to` (dates), `recentLimit` (default: 10)

```json
Response (200):
{
  "totals": {
    "income": 100000,
    "expenses": 25000,
    "netBalance": 75000
  },
  "categoryBreakdown": {
    "income": { "Salary": 100000 },
    "expenses": { "Office": 5000, "Utilities": 3000 }
  },
  "recentTransactions": [...]
}
```

#### GET /api/dashboard/trends
Query params: `from`, `to`, `period` (day/week/month/year)

Returns trend data grouped by period.

## 📊 Database Schema

### User Model
```
id: UUID (primary key)
email: String (unique)
fullName: String
phone: String (optional)
password: String (hashed)
role: UserRole (VIEWER/ANALYST/ADMIN)
status: UserStatus (ACTIVE/INACTIVE)
createdAt: DateTime
updatedAt: DateTime
```

### FinancialRecord Model
```
id: UUID (primary key)
amount: Decimal(14,2)
type: RecordType (INCOME/EXPENSE)
category: String
date: Date
notes: String (optional)
deletedAt: DateTime (optional, soft delete)
createdAt: DateTime
updatedAt: DateTime
createdById: UUID (foreign key → User)

Indexes: date, type, category (optimize queries)
```

## 🚨 Error Handling

### Standard Response Format
```json
{
  "error": "ErrorCode",
  "message": "Human-readable description",
  "details": {} // optional
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | User fetched, record updated |
| 201 | Created | New user/record created |
| 400 | Bad request | Missing/invalid fields |
| 401 | Unauthorized | No/invalid JWT token |
| 403 | Forbidden | Insufficient role/inactive account |
| 404 | Not found | User/record doesn't exist |
| 409 | Conflict | Email already registered |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Unhandled exception |

## 🔒 Security Features

✓ **Password Security**: bcryptjs hashing (10 rounds)
✓ **Token Security**: JWT with HMAC-SHA256, HTTP-only cookies
✓ **Input Validation**: All fields validated before processing
✓ **SQL Injection Prevention**: Prisma prepared statements
✓ **RBAC**: Role-based access on all sensitive operations
✓ **Rate Limiting**: Global + auth-specific limiters
✓ **Soft Deletes**: Maintains audit trail
✓ **Status Checks**: Inactive accounts blocked at auth layer

### Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Use HTTPS for all requests
- [ ] Store secrets in environment vault
- [ ] Enable database connection pooling
- [ ] Set up monitoring and error logging
- [ ] Implement CORS with specific origins (not `*`)
- [ ] Regular database backups
- [ ] Use reverse proxy (Nginx) with rate limiting

## 🔧 Middleware Stack (Execution Order)

1. **CORS** - Cross-origin request validation
2. **Body Parser** - JSON/form data parsing
3. **Cookie Parser** - Cookie extraction
4. **Global Rate Limiter** - Request quota (100/15min)
5. **Route Handler** - Route matching
6. **Auth Middleware** - JWT validation (protected routes only)
7. **RBAC Middleware** - Role validation (protected routes only)
8. **Controller** - Business logic execution
9. **Error Handler** - Centralized error response

---

**Version**: 1.0.0 | **Updated**: April 4, 2025

For quick start, see README.md. For live API details, contact support.
