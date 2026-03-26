const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");

// Public pages — no login needed
router.get("/login",  (req, res) => res.render("login"));
router.get("/signup", (req, res) => res.render("signup"));

// Home page — protected (login zaroori)
router.get("/", authMiddleware, (req, res) => res.render("home", { user: req.user }));

module.exports = router;