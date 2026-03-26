# URL Shortener — Node.js + Express + MongoDB

A backend-focused URL shortener with **JWT authentication**, **MVC architecture**, analytics, rate limiting, and URL expiry.

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose |
| Templating | EJS |
| Auth | JWT (jsonwebtoken) + bcrypt |
| UA Parsing | ua-parser-js |
| Rate Limiting | express-rate-limit |
| Config | dotenv |

---

## 📁 Project Structure (MVC)

```
shortURL/
├── config/
│   └── db.js                 ← MongoDB connection with retry logic
├── controllers/
│   ├── auth.controller.js    ← signup, login, logout
│   └── url.js                ← create, redirect, analytics, delete
├── middlewares/
│   ├── auth.middleware.js    ← JWT verify (reads cookie → req.user)
│   └── rateLimiter.js        ← 10 req/min per IP
├── models/
│   ├── user.model.js         ← username, email, password(hashed)
│   └── url.js                ← URL schema + TTL index
├── routes/
│   ├── auth.routes.js        ← /api/auth/*
│   ├── url.js                ← /api/shorturl/*
│   └── static.js             ← page routes
├── views/
│   ├── home.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   ├── urlhistory.ejs
│   └── analytics.ejs
├── index.js                  ← server entry point
├── .env
└── .env.example
```

---

## ✅ Features

### Authentication (JWT)
- Signup — bcrypt password hash → JWT token → HttpOnly cookie
- Login — bcrypt compare → JWT token → HttpOnly cookie
- Logout — cookie clear
- Protected routes — `authMiddleware` reads cookie → `jwt.verify()` → `req.user`

### URL Management
- Shorten any `http/https` URL
- Custom slug (e.g. `/api/shorturl/my-link`)
- URL expiry — set days; MongoDB TTL index auto-deletes
- Each URL linked to `createdBy: userId` — users see only their own URLs
- Delete own URLs only (ownership check)

### Analytics
- Visit tracking: browser, OS, device (parsed from User-Agent)
- Total visits, last visited, recent 10 visits log

### Security & Performance
- Rate limiting — 10 URL creations per minute per IP
- HttpOnly cookies — JS cannot access token (XSS protection)
- Case-insensitive short ID lookup
- MongoDB TTL index for auto-cleanup of expired URLs

---

## 📊 Database Schemas

### User
```javascript
{ username, email, password (bcrypt hash), createdAt, updatedAt }
```

### URL
```javascript
{
  shortId, originalUrl, customSlug,
  visitHistory: [{ timestamp, browser, os, device }],
  totalVisits, expiresAt,
  createdBy: ObjectId → User  // ownership
}
```

---

## 📋 API Endpoints

### Auth
```
POST /api/auth/signup    → Register (sets JWT cookie)
POST /api/auth/login     → Login (sets JWT cookie)
GET  /api/auth/logout    → Logout (clears cookie)
```

### URLs (🔒 protected except redirect)
```
POST   /api/shorturl              → Create short URL
GET    /api/shorturl              → Get my URLs (JSON)
GET    /api/shorturl/:shortId     → Redirect (public ✅)
GET    /api/shorturl/analytics/:shortId → Get analytics (JSON)
DELETE /api/shorturl/:shortId     → Delete my URL
```

### Pages
```
GET /           → Home (🔒 login required)
GET /login      → Login form
GET /signup     → Signup form
GET /urlhistory → My URL history (🔒)
GET /analytics/:shortId → Analytics page (🔒)
```

---

## 🚀 Getting Started

```bash
npm install
```

Create `.env`:
```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
PORT=3000
JWT_SECRET=your_long_random_secret_key_here
```

```bash
npm run dev
```

---

## 🧪 Test with cURL

```bash
# Signup
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"aman","email":"aman@test.com","password":"123456"}'

# Create short URL (with saved cookie)
curl -b cookies.txt -X POST http://localhost:3000/api/shorturl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.google.com","customSlug":"google","expiryDays":7}'

# Redirect (public)
curl http://localhost:3000/api/shorturl/google

# Get analytics
curl -b cookies.txt http://localhost:3000/api/shorturl/analytics/google
```

---

## 👨‍💻 Author

Aman Paliwal — Fresher Backend Developer (Node.js + MongoDB)
