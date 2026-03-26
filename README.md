# URL Shortener

A backend-focused URL shortener service built with Node.js and Express. This project was developed to practice and demonstrate core backend concepts like MVC architecture, authentication, and database indexing.

## Features

- URL shortening and redirection
- User authentication (JWT + bcrypt stored in HttpOnly cookies)
- Visit analytics (tracking operating system, browser, and timestamps)
- Rate limiting (max 10 creations per minute per IP)
- Auto-expiring URLs using MongoDB TTL indexes
- Custom user-defined short URLs

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Auth:** jsonwebtoken, bcrypt
- **Views:** EJS (for simple server-side rendering)

## Project Structure

The codebase is organized following the MVC pattern:
- `controllers/` - Handles the business logic (auth and URL operations)
- `models/` - Mongoose schemas (User, URL)
- `middlewares/` - Custom middleware for JWT auth verification and rate limiting
- `routes/` - API and static route definitions
- `views/` - EJS templates for the simple frontend interfaces

## Local Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```env
   MONGO_URL=mongodb+srv://<username>:<password>@cluster/
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be running at `http://localhost:3000`.

## API Endpoints

**Auth**
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/logout` - Clear auth cookie

**URLs**
- `POST /api/shorturl` - Create a new short URL (Requires Auth)
- `GET /api/shorturl/:shortId` - Redirect to original URL (Public)
- `GET /api/shorturl/analytics/:shortId` - Get view statistics (Requires Auth)

## Author

Aman Paliwal  
