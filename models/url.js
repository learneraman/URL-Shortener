const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      unique: true,
      required: [true, "Short ID is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: [true, "Original URL is required"],
      validate: {
        validator: function(v) { return /^https?:\/\/.+/.test(v); },
        message: "Please provide a valid URL starting with http:// or https://",
      },
    },
    visitHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        browser:   { type: String, default: "Unknown" },
        os:        { type: String, default: "Unknown" },
        device:    { type: String, default: "Desktop" },
      },
    ],
    totalVisits: { type: Number, default: 0 },
    customSlug:  { type: String, default: null },
    expiresAt:   { type: Date,   default: null },

    // Har URL kis user ne banaya — ObjectId reference to User model
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes when expiresAt is reached
urlSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: "date" } } }
);

const Url = mongoose.model("Url", urlSchema);
module.exports = Url;