const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, "secretkey");

      // Attach user id to request
      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};

module.exports = protect;