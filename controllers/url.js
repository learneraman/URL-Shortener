const shortid    = require("shortid");
const { UAParser } = require("ua-parser-js");
const URL         = require("../models/url");
const { redisCache } = require("../config/redis");

function isValidUrl(string) {
  try {
    const u = new globalThis.URL(string);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) { return false; }
}

function parseUA(uaString) {
  const parser = new UAParser(uaString);
  const os     = parser.getOS();
  const device = parser.getDevice();
  return {
    os:     os.name      ? `${os.name} ${os.version || ""}`.trim() : "Unknown",
    device: device.type  ? device.type                             : "Desktop",
  };
}

// ─── Create Short URL ─────────────────────────────────────────────────────────
async function createShortUrl(req, res) {
  try {
    const { url, customSlug, expiryDays } = req.body;

    if (!url || url.trim() === "") return res.redirect("/?" + new URLSearchParams({ error: "Please enter a URL." }).toString());
    if (!isValidUrl(url)) return res.redirect("/?" + new URLSearchParams({ error: "Invalid URL. Must start with http:// or https://" }).toString());
    if (url.length > 2048) return res.redirect("/?" + new URLSearchParams({ error: "URL too long. Max 2048 chars." }).toString());

    if (customSlug) {
      if (!/^[a-zA-Z0-9_-]+$/.test(customSlug)) return res.redirect("/?" + new URLSearchParams({ error: "Slug: only letters, numbers, - and _ allowed." }).toString());
      const slugExists = await URL.findOne({ shortId: customSlug.toLowerCase() });
      if (slugExists) return res.redirect("/?" + new URLSearchParams({ error: `Slug '${customSlug}' is already taken.` }).toString());
    }

    const existing = await URL.findOne({ originalUrl: url, createdBy: req.user.id });
    if (existing) {
      const message = customSlug ? "You already have a shortened link for this URL. Custom slug was ignored." : "Already shortened!";
      return res.redirect("/?" + new URLSearchParams({ shortID: existing.shortId, message }).toString());
    }

    let expiresAt = null;
    if (expiryDays && !isNaN(expiryDays) && Number(expiryDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const shortID = customSlug ? customSlug.toLowerCase() : shortid.generate();

    const newUrl = await URL.create({
      shortId: shortID,
      originalUrl: url,
      visitHistory: [],
      customSlug: customSlug || null,
      expiresAt,
      createdBy: req.user.id,
    });

    console.log(`✓ [${req.user.email}] Created: ${shortID} → ${url}`);
    
    // Redirect with success values
    const queryParams = new URLSearchParams({ shortID: newUrl.shortId });
    if (newUrl.expiresAt) queryParams.append("expiresAt", newUrl.expiresAt.toISOString());
    return res.redirect("/?" + queryParams.toString());

  } catch (err) {
    console.error("❌ createShortUrl:", err.message);
    return res.redirect("/?" + new URLSearchParams({ error: "Server error. Try again." }).toString());
  }
}

// ─── Get All (only current user's URLs) ───────────────────────────────────────
async function getallShortUrl(req, res) {
  try {
    const urls = await URL.find({ createdBy: req.user.id }).select("-__v").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: urls.length, data: urls });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch URLs" });
  }
}

// ─── Redirect (public) - WITH REDIS LAYER ─────────────────────────────────────
async function getShortUrl(req, res) {
  try {
    const { shortId } = req.params;
    const { os, device } = parseUA(req.get("user-agent") || "");
    const cacheKey = `url:${shortId.toLowerCase()}`;

    // 1. Check Redis Cache
    let originalUrl = await redisCache.get(cacheKey);

    if (originalUrl) {
      // CACHE HIT: Instant Redirect
      res.redirect(originalUrl);
      // Fire-and-forget DB update in background (Async message passing logic)
      URL.findOneAndUpdate(
        { shortId: { $regex: new RegExp(`^${shortId}$`, "i") } },
        { $push: { visitHistory: { timestamp: new Date(), os, device } }, $inc: { totalVisits: 1 } }
      ).exec();
      return;
    }

    // 2. CACHE MISS: Hit MongoDB
    const entry = await URL.findOneAndUpdate(
      { shortId: { $regex: new RegExp(`^${shortId}$`, "i") } },
      { $push: { visitHistory: { timestamp: new Date(), os, device } }, $inc: { totalVisits: 1 } },
      { new: true }
    );

    if (!entry) return res.status(404).json({ success: false, error: "URL not found" });
    if (entry.expiresAt && new Date() > entry.expiresAt) return res.status(410).json({ success: false, error: "URL expired" });

    // Save in Redis for next time (TTL: 24 hours / 86400 secs) so memory doesn't overfill
    await redisCache.setEx(cacheKey, 86400, entry.originalUrl);

    return res.redirect(entry.originalUrl);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Redirect failed" });
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────
async function deleteShortUrl(req, res) {
  try {
    const shortIdStr = req.params.shortId;
    const deleted = await URL.findOneAndDelete({
      shortId: { $regex: new RegExp(`^${shortIdStr}$`, "i") },
      createdBy: req.user.id,
    });

    if (!deleted) return res.status(404).json({ success: false, error: "URL not found or not yours" });

    // Cache Invalidation — delete from Redis to prevent stale redirects
    await redisCache.del(`url:${shortIdStr.toLowerCase()}`);

    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Delete failed" });
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────
async function getUrlAnalytics(req, res) {
  try {
    const url = await URL.findOne({
      shortId: { $regex: new RegExp(`^${req.params.shortId}$`, "i") },
      createdBy: req.user.id,
    });
    if (!url) return res.status(404).json({ success: false, error: "URL not found or not yours" });

    return res.status(200).json({ success: true, data: url });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Analytics failed" });
  }
}

module.exports = { createShortUrl, getShortUrl, getallShortUrl, deleteShortUrl, getUrlAnalytics };
