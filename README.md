# VoteSecure - Secure Online Voting Platform

A full-stack secure voting platform built with React, Node.js, Express, and MongoDB.

## Folder Structure

```
├── server/                   # Backend (Node.js + Express)
│   ├── models/
│   │   ├── User.js
│   │   ├── Election.js
│   │   ├── Candidate.js
│   │   ├── Vote.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── elections.js
│   │   ├── candidates.js
│   │   ├── votes.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── email.js
│   ├── server.js
│   └── package.json
│
├── src/                      # Frontend (React + Vite)
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   └── api.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── OTPVerification.tsx
│   │   ├── voter/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Elections.tsx
│   │   │   └── Vote.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── ManageElections.tsx
│   │       ├── ManageCandidates.tsx
│   │       ├── Results.tsx
│   │       └── AuditLogs.tsx
│   └── App.tsx
└── package.json
```

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Gmail account with App Password enabled

## Setup & Run

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting_platform
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

CLIENT_URL=http://localhost:5173
```

**Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail"
4. Paste it as `GMAIL_APP_PASSWORD`

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
npm install
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

### 3. Create an Admin User

Register a normal account, verify OTP, then update the role in MongoDB:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

## Features

- **Auth**: Register → OTP email verification → Login with JWT
- **OTP**: 6-digit code, 2-minute expiry, resend capability, attempt limiting
- **Voter**: Browse elections, cast single vote per election, view voting history
- **Admin**: Create/manage elections, add candidates, view live results with bar/pie charts, audit logs
- **Security**: bcrypt password hashing, JWT auth, role-based access control, duplicate vote prevention, rate limiting
