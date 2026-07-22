const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Fail fast if JWT_SECRET is not configured
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set in environment variables");
        return res.status(500).json({ message: "Server configuration error" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Look up the user — they may have been deleted since the token was issued
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user no longer exists" });
      }

      return next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // No token present at all
  return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
