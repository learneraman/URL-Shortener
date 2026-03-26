const shortid    = require("shortid");
const { UAParser } = require("ua-parser-js");
const URL         = require("../models/url");

function isValidUrl(string) {
  try {
    const u = new globalThis.URL(string);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) { return false; }
}

function parseUA(uaString) {
  const parser  = new UAParser(uaString);
  const browser = parser.getBrowser();
  const os      = parser.getOS();
  const device  = parser.getDevice();
  return {
    browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown",
    os:      os.name      ? `${os.name} ${os.version || ""}`.trim()           : "Unknown",
    device:  device.type  ? device.type                                        : "Desktop",
  };
}

// ─── Create Short URL ─────────────────────────────────────────────────────────
// POST /api/shorturl  (🔒 protected — req.user available from authMiddleware)
async function createShortUrl(req, res) {
  try {
    const { url, customSlug, expiryDays } = req.body;

    if (!url || url.trim() === "")
      return res.render("home", { user: req.user, error: "Please enter a URL." });

    if (!isValidUrl(url))
      return res.render("home", { user: req.user, error: "Invalid URL. Must start with http:// or https://" });

    if (url.length > 2048)
      return res.render("home", { user: req.user, error: "URL too long. Max 2048 chars." });

    if (customSlug) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customSlug))
        return res.render("home", { user: req.user, error: "Slug: only letters, numbers, - and _ allowed." });
      const slugExists = await URL.findOne({ shortId: customSlug.toLowerCase() });
      if (slugExists)
        return res.render("home", { user: req.user, error: `Slug '${customSlug}' is already taken.` });
    }

    // Check if THIS user already shortened the same URL
    const existing = await URL.findOne({ originalUrl: url, createdBy: req.user.id });
    if (existing && !customSlug)
      return res.render("home", { user: req.user, shortID: existing.shortId, message: "Already shortened!" });

    let expiresAt = null;
    if (expiryDays && !isNaN(expiryDays) && Number(expiryDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const shortID = customSlug ? customSlug.toLowerCase() : shortid.generate();

    const newUrl = await URL.create({
      shortId:     shortID,
      originalUrl: url,
      visitHistory: [],
      customSlug:  customSlug || null,
      expiresAt,
      createdBy:   req.user.id,   // JWT se milta hai req.user.id
    });

    console.log(`✓ [${req.user.email}] Created: ${shortID} → ${url}`);
    return res.render("home", { user: req.user, shortID: newUrl.shortId, expiresAt: newUrl.expiresAt });

  } catch (err) {
    console.error("❌ createShortUrl:", err.message);
    return res.render("home", { user: req.user, error: "Server error. Try again." });
  }
}

// ─── Get All (only current user's URLs) ───────────────────────────────────────
// GET /api/shorturl  (🔒 protected)
async function getallShortUrl(req, res) {
  try {
    // createdBy filter — sirf apni URLs
    const urls = await URL.find({ createdBy: req.user.id }).select("-__v").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: urls.length, data: urls });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch URLs" });
  }
}

// ─── Redirect (public) ────────────────────────────────────────────────────────
// GET /api/shorturl/:shortId
async function getShortUrl(req, res) {
  try {
    const { shortId } = req.params;
    const { browser, os, device } = parseUA(req.get("user-agent") || "");

    const entry = await URL.findOneAndUpdate(
      { shortId: { $regex: new RegExp(`^${shortId}$`, "i") } },
      { $push: { visitHistory: { timestamp: new Date(), browser, os, device } }, $inc: { totalVisits: 1 } },
      { new: true }
    );

    if (!entry) return res.status(404).json({ success: false, error: "URL not found" });
    if (entry.expiresAt && new Date() > entry.expiresAt)
      return res.status(410).json({ success: false, error: "URL expired" });

    return res.redirect(entry.originalUrl);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Redirect failed" });
  }
}

// ─── Delete (🔒 protected + ownership check) ─────────────────────────────────
// DELETE /api/shorturl/:shortId
async function deleteShortUrl(req, res) {
  try {
    const deleted = await URL.findOneAndDelete({
      shortId:   { $regex: new RegExp(`^${req.params.shortId}$`, "i") },
      createdBy: req.user.id,   // sirf apni URL delete kar sakta hai
    });
    if (!deleted) return res.status(404).json({ success: false, error: "URL not found or not yours" });
    return res.status(200).json({ success: true, message: "Deleted", data: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Delete failed" });
  }
}

// ─── Analytics (🔒 protected) ─────────────────────────────────────────────────
// GET /api/shorturl/analytics/:shortId
async function getUrlAnalytics(req, res) {
  try {
    const url = await URL.findOne({
      shortId:   { $regex: new RegExp(`^${req.params.shortId}$`, "i") },
      createdBy: req.user.id,
    });
    if (!url) return res.status(404).json({ success: false, error: "URL not found or not yours" });

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, error: "Analytics failed" });
  }
}

module.exports = { createShortUrl, getShortUrl, getallShortUrl, deleteShortUrl, getUrlAnalytics };
