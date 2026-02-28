const express = require("express");
const { registerUser } = require("../controllers/authController");

const router = express.Router();

// Signup route
router.post("/register", registerUser);

module.exports = router;