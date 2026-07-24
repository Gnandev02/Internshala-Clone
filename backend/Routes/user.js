const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const PasswordResetLog = require("../Model/PasswordResetLog");

// Letter-only random password generator helper
function generateLetterOnlyPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

// 1. Direct MongoDB User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const photo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const user = new User({
      name,
      email: cleanEmail,
      password: password.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : "",
      photo,
    });

    await user.save();

    // Clear any previous password reset logs for fresh user registration
    await PasswordResetLog.deleteMany({ identifier: cleanEmail });

    res.status(201).json({ message: "User registered successfully in MongoDB", user });
  } catch (error) {
    console.error("MongoDB Register Error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// 2. Direct MongoDB User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in MongoDB by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ error: "User not found. Please register first." });
    }

    // Compare stored password in MongoDB
    if (user.password) {
      if (user.password.trim() !== password.trim()) {
        return res.status(400).json({ error: "Invalid credentials. Incorrect password." });
      }
    } else {
      // Set password for existing record if missing
      user.password = password.trim();
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("MongoDB Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// 3. Direct MongoDB Password Reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: "Email or phone number is required" });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Enforce Once-per-Day limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingLog = await PasswordResetLog.findOne({
      identifier: cleanIdentifier,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingLog) {
      return res.status(429).json({ error: "You can use this option only once per day." });
    }

    // Find user in MongoDB by email or phone number
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phoneNumber: cleanIdentifier }],
    });

    if (!user) {
      return res.status(404).json({ error: "No account found matching that email or phone number." });
    }

    // Determine new password (custom user password or letter-only generated password)
    const finalPassword = newPassword && newPassword.trim() ? newPassword.trim() : generateLetterOnlyPassword(12);

    // Directly update password in MongoDB
    user.password = finalPassword;
    user.lastPasswordResetDate = new Date();
    await user.save();

    // Log the reset
    const resetLog = new PasswordResetLog({
      identifier: cleanIdentifier,
      generatedPassword: finalPassword,
      resetDate: new Date(),
    });
    await resetLog.save();

    console.log(`✓ MongoDB password updated successfully for: ${cleanIdentifier}`);

    res.status(200).json({
      message: "Password updated successfully in MongoDB.",
      password: finalPassword,
      identifier: cleanIdentifier,
    });
  } catch (error) {
    console.error("MongoDB Forgot Password Error:", error);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

// 4. Sync Firebase/Google User to MongoDB (Backward compatibility)
router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, name, email, photo } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ $or: [{ email: cleanEmail }, { firebaseUid }] });

    if (!user) {
      user = new User({
        firebaseUid: firebaseUid || new mongoose.Types.ObjectId().toString(),
        name,
        email: cleanEmail,
        photo: photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "User")}`,
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in user sync:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Get User Profile by ID
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
