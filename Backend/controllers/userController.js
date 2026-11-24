const User = require("../models/User");

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const rawSearch = req.query.search;
    if (!rawSearch || typeof rawSearch !== "string" || !rawSearch.trim()) {
      return res.json([]);
    }

    // Escape regex special characters to prevent ReDoS
    const safeSearch = rawSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const keyword = {
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ],
      _id: { $ne: req.user.id }, // Exclude the requesting user
    };

    const users = await User.find(keyword).select("-password").limit(30);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};