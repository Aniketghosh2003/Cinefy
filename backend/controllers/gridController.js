const Grid = require("../models/Grid");
const Like = require("../models/Like");

// Create Grid
exports.createGrid = async (req, res) => {
  try {
    const { title, items } = req.body;

    if (!items || items.length !== 9) {
      return res.status(400).json({ message: "A grid must have exactly 9 items" });
    }

    const grid = await Grid.create({
      userId: req.user.id,
      title,
      items,
    });

    res.status(201).json(grid);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Grids (Community)
exports.getAllGrids = async (req, res) => {
  try {
    const grids = await Grid.find()
      .populate("userId", "username profilePic")
      .populate("items")
      .sort({ likesCount: -1, createdAt: -1 });

    res.status(200).json(grids);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get My Grids
exports.getMyGrids = async (req, res) => {
  try {
    const grids = await Grid.find({ userId: req.user.id })
      .populate("items")
      .sort({ createdAt: -1 });

    res.status(200).json(grids);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Toggle Like on Grid
exports.toggleLike = async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ userId, targetId, targetType: "grid" });

    if (existingLike) {
      await existingLike.deleteOne();
      await Grid.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
      res.status(200).json({ message: "Unliked grid" });
    } else {
      await Like.create({ userId, targetId, targetType: "grid" });
      await Grid.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
      res.status(200).json({ message: "Liked grid" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
