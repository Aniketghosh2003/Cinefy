const User = require("../models/User");

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("watchLater")
      .populate("watched");
      
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update User Profile (Username / Pic)
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.username = req.body.username || user.username;
      user.profilePic = req.body.profilePic || user.profilePic;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add/Remove Watch Later
exports.toggleWatchLater = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const contentId = req.body.contentId;

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.watchLater.includes(contentId)) {
      user.watchLater = user.watchLater.filter((id) => id.toString() !== contentId);
    } else {
      user.watchLater.push(contentId);
    }

    await user.save();
    res.json(user.watchLater);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add/Remove Watched
exports.toggleWatched = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const contentId = req.body.contentId;

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.watched.includes(contentId)) {
      user.watched = user.watched.filter((id) => id.toString() !== contentId);
    } else {
      user.watched.push(contentId);
      // Remove from watchLater if adding to watched
      user.watchLater = user.watchLater.filter((id) => id.toString() !== contentId);
    }

    await user.save();
    res.json({ watched: user.watched, watchLater: user.watchLater });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
