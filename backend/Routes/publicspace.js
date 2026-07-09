const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const User = require("../Model/User");
const Comment = require("../Model/Comment");
const Like = require("../Model/Like");
const Share = require("../Model/Share");
const { upload, cloudinary } = require("../config/cloudinary");

// 1. Create a Post
router.post("/post", upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { userId, caption } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // Enforce limits based on friend count
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const friendCount = user.friends.length;
    
    if (friendCount === 0) {
      return res.status(403).json({ error: "Add friends to start posting." });
    }

    if (friendCount <= 10) {
      // Calculate today's posts
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayPostCount = await Post.countDocuments({
        user: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (todayPostCount >= friendCount) {
        return res.status(403).json({ error: `Daily posting limit reached. You can make ${friendCount} post(s) per day with ${friendCount} friend(s).` });
      }
    }

    // Process media from Cloudinary
    let images = [];
    let video = null;

    if (req.files && req.files.images) {
      images = req.files.images.map(f => ({
        secure_url: f.path,
        public_id: f.filename,
        resource_type: 'image'
      }));
    }

    if (req.files && req.files.video && req.files.video.length > 0) {
      const v = req.files.video[0];
      video = {
        secure_url: v.path,
        public_id: v.filename,
        resource_type: 'video'
      };
    }

    const post = new Post({
      user: userId,
      caption,
      images,
      video
    });

    await post.save();
    await post.populate("user", "name photo");

    res.status(201).json({ message: "Post created", post });
  } catch (error) {
    console.error("Post error:", error);
    res.status(500).json({ error: "Server error during post creation" });
  }
});

// 2. Fetch Feed
router.get("/feed", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "name photo")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    // Optional: add boolean flag for currentUser if they liked it (requires userId in query)
    const { userId } = req.query;
    let feed = posts;
    if (userId) {
      const userLikes = await Like.find({ user: userId, post: { $in: posts.map(p => p._id) } });
      const likedPostIds = new Set(userLikes.map(l => l.post.toString()));
      
      feed = posts.map(post => {
        const postObj = post.toObject();
        postObj.hasLiked = likedPostIds.has(post._id.toString());
        return postObj;
      });
    }

    res.status(200).json(feed);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Delete Post
router.delete("/post/:id", async (req, res) => {
  try {
    const { userId } = req.body; // or req.query depending on how frontend calls it
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user.toString() !== userId) return res.status(403).json({ error: "Unauthorized" });

    // Delete media from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        await cloudinary.uploader.destroy(img.public_id, { resource_type: img.resource_type });
      }
    }
    if (post.video) {
      await cloudinary.uploader.destroy(post.video.public_id, { resource_type: post.video.resource_type });
    }

    // Delete associated comments, likes, shares
    await Comment.deleteMany({ post: post._id });
    await Like.deleteMany({ post: post._id });
    await Share.deleteMany({ post: post._id });

    await Post.findByIdAndDelete(post._id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Like Post
router.post("/like", async (req, res) => {
  try {
    const { userId, postId } = req.body;
    
    const existingLike = await Like.findOne({ user: userId, post: postId });
    if (existingLike) {
      return res.status(400).json({ error: "Already liked" });
    }

    const like = new Like({ user: userId, post: postId });
    await like.save();

    await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

    res.status(200).json({ message: "Post liked" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Unlike Post
router.delete("/unlike", async (req, res) => {
  try {
    const { userId, postId } = req.body; // or via query params

    const deletedLike = await Like.findOneAndDelete({ user: userId, post: postId });
    if (!deletedLike) {
      return res.status(400).json({ error: "Not liked yet" });
    }

    await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

    res.status(200).json({ message: "Post unliked" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 6. Comment on Post
router.post("/comment", async (req, res) => {
  try {
    const { userId, postId, text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const comment = new Comment({ user: userId, post: postId, text });
    await comment.save();
    
    await comment.populate("user", "name photo");

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get comments for a post
router.get("/comment/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name photo")
      .sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 7. Delete Comment
router.delete("/comment/:id", async (req, res) => {
  try {
    const { userId } = req.body; 
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.user.toString() !== userId) return res.status(403).json({ error: "Unauthorized" });

    await Comment.findByIdAndDelete(comment._id);
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 8. Share Post
router.post("/share", async (req, res) => {
  try {
    const { userId, postId } = req.body;
    
    // In a real app, a share might create a new post linking to the old one.
    // For this simple schema, we just log the share and increment count.
    const share = new Share({ user: userId, post: postId });
    await share.save();

    await Post.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } });

    res.status(200).json({ message: "Post shared" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
