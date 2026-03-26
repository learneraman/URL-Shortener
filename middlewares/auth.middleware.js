const jwt  = require("jsonwebtoken");

// ─── Auth Middleware ─────────────────────────────────────────────────────────
// Yeh middleware har protected route ke pehle chalta hai
// Cookie se token nikalta hai → verify karta hai → req.user set karta hai
function authMiddleware(req, res, next) {
  const token = req.cookies?.token; // cookie-parser ki wajah se milta hai

  // Token nahi hai → login page pe bhejo
  if (!token) return res.redirect("/login");

  try {
    // jwt.verify() — token ko secret key se verify karo
    // Agar token valid hai → decoded payload milta hai { id, email, username }
    // Agar fake/expired → error throw hota hai → catch mein jayega
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Aage ke handlers mein req.user available hoga
    next();             // Aage bhejo

  } catch (err) {
    // Token invalid ya expire → cookie clear karo aur login bhejo
    res.clearCookie("token");
    return res.redirect("/login");
  }
}

module.exports = { authMiddleware };
