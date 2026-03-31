const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const User   = require("../models/user.model");

// ─── SIGNUP ────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password)
      return res.render("signup", { error: "All fields are required." });

    if (password.length < 6)
      return res.render("signup", { error: "Password must be at least 6 characters." });

    // Check if email already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.render("signup", { error: "Email already registered. Please login." });

    // Hash password — NEVER store plain text password
    // bcrypt.hash(password, saltRounds) — saltRounds=10 means 2^10 hashing rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to DB
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate JWT token — sign karo user ki id aur email se
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "5d" }
    );

    const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 5;
    res.cookie("token", token, {
      httpOnly: true,
      maxAge:   cookieDays * 24 * 60 * 60 * 1000,
    });

    console.log(`✓ New user registered: ${user.email}`);
    return res.redirect("/");

  } catch (err) {
    console.error("❌ signup error:", err.message);
    return res.render("signup", { error: "Server error. Please try again." });
  }
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.render("login", { error: "Email and password are required." });

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.render("login", { error: "Invalid email or password." });

    // bcrypt.compare() — entered password ko stored hash se compare karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.render("login", { error: "Invalid email or password." });

    // Sign a fresh JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "5d" }
    );

    const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 5;
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
    });

    console.log(`✓ User logged in: ${user.email}`);
    return res.redirect("/");

  } catch (err) {
    console.error("❌ login error:", err.message);
    return res.render("login", { error: "Server error. Please try again." });
  }
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────────
// GET /api/auth/logout
function logout(req, res) {
  res.clearCookie("token");       // Cookie delete karo
  return res.redirect("/login");  // Login page pe bhejo
}

module.exports = { signup, login, logout };
