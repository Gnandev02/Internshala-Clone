const express = require("express");
const router = express.Router();
const FriendRequest = require("../Model/FriendRequest");
const User = require("../Model/User");

// Middleware to ensure user is provided (can be passed in body for simplicity since auth is firebase)
// In production, you'd decode Firebase token in header. Here we rely on frontend passing userId.

// Send Friend Request
router.post("/request", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) return res.status(400).json({ error: "Missing IDs" });
    if (senderId === receiverId) return res.status(400).json({ error: "Cannot send request to self" });

    // Check if already friends
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check for existing request
    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: "pending",
    });

    if (existingReq) {
      return res.status(400).json({ error: "Friend request already exists" });
    }

    const friendRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
    });
    await friendRequest.save();

    res.status(201).json({ message: "Friend request sent", friendRequest });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Accept Friend Request
router.post("/accept", async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(400).json({ error: "Invalid or processed request" });
    }

    request.status = "accepted";
    await request.save();

    // Add to each other's friends list
    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Reject Friend Request
router.post("/reject", async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(400).json({ error: "Invalid or processed request" });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Remove Friend
router.delete("/remove", async (req, res) => {
  try {
    const { userId, targetId } = req.body;

    if (!userId || !targetId) return res.status(400).json({ error: "Missing IDs" });

    await User.findByIdAndUpdate(userId, { $pull: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { friends: userId } });

    // Optionally delete old friend requests between them
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: targetId },
        { sender: targetId, receiver: userId },
      ]
    });

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get pending requests for a user
router.get("/requests/:userId", async (req, res) => {
  try {
    const requests = await FriendRequest.find({ receiver: req.params.userId, status: "pending" }).populate("sender", "name photo email");
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get available users (not friends, not self, no pending requests) to discover
router.get("/discover/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(userId);
    
    if(!currentUser) return res.status(404).json({error: "User not found"});

    const pendingRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "pending"
    });

    const pendingUserIds = pendingRequests.map(req => 
      req.sender.toString() === userId ? req.receiver : req.sender
    );

    const excludeIds = [userId, ...currentUser.friends, ...pendingUserIds];

    const users = await User.find({ _id: { $nin: excludeIds } }).select("name photo email").limit(20);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
