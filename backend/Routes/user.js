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

const PasswordResetLog = require("../Model/PasswordResetLog");

// Letter-only random password generator (no numbers, no special characters)
function generateLetterOnlyPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: "Email or phone number is required" });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Check once-per-day limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingLog = await PasswordResetLog.findOne({
      identifier: cleanIdentifier,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingLog) {
      return res.status(429).json({ error: "You can use this option only once per day." });
    }

    // 2. Generate random letter-only password
    const newPassword = generateLetterOnlyPassword(12);

    // 3. Create log entry
    const resetLog = new PasswordResetLog({
      identifier: cleanIdentifier,
      generatedPassword: newPassword,
      resetDate: new Date(),
    });
    await resetLog.save();

    // 4. Update user in MongoDB if found
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phoneNumber: cleanIdentifier }
      ]
    });

    if (user) {
      user.lastPasswordResetDate = new Date();
      await user.save();
    }

    res.status(200).json({
      message: "Password reset request generated successfully.",
      newPassword,
      identifier: cleanIdentifier
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error during password reset" });
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

