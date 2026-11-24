const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Apply auth rate limiter
router.use(authLimiter);

// Signup
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

module.exports = router;