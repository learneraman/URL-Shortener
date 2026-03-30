const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  createShortUrl,
  getShortUrl,
  getallShortUrl,
  deleteShortUrl,
  getUrlAnalytics,
} = require("../controllers/url.js");

// 🔒 Protected — login zaroori hai
router.post("/",                        authMiddleware, createShortUrl);
router.get("/",                         authMiddleware, getallShortUrl);
router.delete("/:shortId",             authMiddleware, deleteShortUrl);

// Analytics (JSON) — protected
router.get("/analytics/:shortId",      authMiddleware, getUrlAnalytics);

// Public — anyone can use a short link to redirect
router.get("/:shortId", getShortUrl);

module.exports = router;