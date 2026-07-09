const express = require("express");
const router = express.Router();
const User = require("../Model/User");

// Sync Firebase User to MongoDB
router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, name, email, photo } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: "firebaseUid and email are required" });
    }

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = new User({
        firebaseUid,
        name,
        email,
        photo,
      });
      await user.save();
    } else {
      // Optional: Update name/photo if they changed
      let updated = false;
      if (user.name !== name && name) {
        user.name = name;
        updated = true;
      }
      if (user.photo !== photo && photo) {
        user.photo = photo;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in user sync:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile (optional, for friends list etc.)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("friends", "name photo email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
