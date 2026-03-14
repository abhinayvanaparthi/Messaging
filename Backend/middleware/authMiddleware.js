const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  console.log("=== Auth Middleware ===");
  console.log("Headers:", req.headers);
  let token;

  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token
      token = req.headers.authorization.split(" ")[1];
      console.log("Token found:", token.substring(0, 20) + "...");

      // Verify token
      const decoded = jwt.verify(token, "secretkey");
      console.log("Decoded user:", decoded);

      // Attach user id to request
      req.user = decoded;

      next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    console.log("No authorization header or invalid format");
  }

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token" });
  }
};

module.exports = protect;