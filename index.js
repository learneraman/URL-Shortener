const express           = require("express");
const path              = require("path");
const cookieParser      = require("cookie-parser");
const helmet            = require("helmet");
const morgan            = require("morgan");
require("dotenv").config();

const connectDB         = require("./config/db");
const { connectRedis }  = require("./config/redis");
const { createLimiter } = require("./middlewares/rateLimiter");
const { authMiddleware } = require("./middlewares/auth.middleware");
const shortURLRoutes    = require("./routes/url");
const staticRoutes      = require("./routes/static");
const authRoutes        = require("./routes/auth.routes");
const URL               = require("./models/url");

const app = express();

// ── Middlewares ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());   // cookie-parser — req.cookies available hoga
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled taaki EJS ke inline scripts chalein
app.use(morgan("dev"));      // Request logging
app.use(express.static(path.join(__dirname, "public"))); // Static CSS/JS files ke liye

// ── Environment Check ──────────────────────────────────────────────────────────
if (!process.env.MONGO_URL) {
  console.error("❌ MONGO_URL not found in .env");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET not found in .env");
  process.exit(1);
}

// ── Database & Redis ──────────────────────────────────────────────────────────
connectDB(process.env.MONGO_URL);
connectRedis();

// ── View Engine ────────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);                           // Signup / Login / Logout
app.use("/api/shorturl", createLimiter, shortURLRoutes);      // URL API (protected inside)
app.use("/", staticRoutes);                                    // Pages (home protected, login/signup public)

// ── Analytics Page (🔒 protected) ─────────────────────────────────────────────
app.get("/analytics/:shortId", authMiddleware, async (req, res) => {
  try {
    const url = await URL.findOne({
      shortId:   { $regex: new RegExp(`^${req.params.shortId}$`, "i") },
      createdBy: req.user.id,
    });
    if (!url) return res.status(404).send("URL not found or not yours.");
    return res.render("analytics", {
      data: {
        shortId:     url.shortId,
        originalUrl: url.originalUrl,
        totalVisits: url.visitHistory.length,
        createdAt:   url.createdAt,
        expiresAt:   url.expiresAt,
        lastVisited: url.visitHistory.length > 0 ? url.visitHistory.at(-1).timestamp : null,
        recentVisits: url.visitHistory.slice(-10),
      },
    });
  } catch (err) {
    return res.status(500).send("Error loading analytics.");
  }
});

// ── URL History Page (🔒 protected) ───────────────────────────────────────────
app.get("/urlhistory", authMiddleware, async (req, res) => {
  try {
    const urls = await URL.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return res.render("urlhistory", { urls, user: req.user });
  } catch (err) {
    return res.status(500).render("urlhistory", { urls: [], user: req.user, error: "Failed to load history" });
  }
});

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Server ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Server running → http://localhost:${PORT}`));