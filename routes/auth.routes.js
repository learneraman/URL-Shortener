const express = require("express");
const router  = express.Router();
const { signup, login, logout } = require("../controllers/auth.controller");

// POST /api/auth/signup — naya user register karo
router.post("/signup", signup);

// POST /api/auth/login — existing user login karo
router.post("/login", login);

// GET /api/auth/logout — logout (cookie clear)
router.get("/logout", logout);

module.exports = router;
