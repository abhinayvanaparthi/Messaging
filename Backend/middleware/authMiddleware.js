const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  // Check authorization header or query param token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is missing");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    // Verify token with configured secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized: invalid or expired token" });
  }
};

module.exports = protect;