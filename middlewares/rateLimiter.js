const rateLimit = require("express-rate-limit");

// Max 10 URL creations per minute per IP
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many requests. Please wait a minute and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createLimiter };
