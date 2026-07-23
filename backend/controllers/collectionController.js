const mongoose = require("mongoose");
const Collection = require("../models/Collection");
const Like = require("../models/Like");

// Create Collection
exports.createCollection = async (req, res) => {
  try {
    const { title, description, items, isPrivate } = req.body;

    const collection = await Collection.create({
      userId: req.user.id,
      title,
      description,
      items: items || [],
      isPrivate: isPrivate || false,
    });

    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Public Collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ isPrivate: false })
      .populate("userId", "username profilePic")
      .populate("items")
      .sort({ likesCount: -1, createdAt: -1 });

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get My Collections
exports.getMyCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ userId: req.user.id })
      .populate("items")
      .sort({ createdAt: -1 });

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Collection By ID
exports.getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findById(id)
      .populate("userId", "username profilePic")
      .populate("items");

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json(collection);
  } catch (error) {
    console.error("getCollectionById error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Toggle Like on Collection
exports.toggleLike = async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ userId, targetId, targetType: "collection" });

    if (existingLike) {
      await existingLike.deleteOne();
      await Collection.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
      res.status(200).json({ message: "Unliked collection" });
    } else {
      await Like.create({ userId, targetId, targetType: "collection" });
      await Collection.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
      res.status(200).json({ message: "Liked collection" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add Item to Collection
exports.addItemToCollection = async (req, res) => {
  try {
    const { collectionId, contentId } = req.body;
    const collection = await Collection.findOne({ _id: collectionId, userId: req.user.id });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.items.includes(contentId)) {
      return res.status(400).json({ message: "Item already in collection" });
    }

    collection.items.push(contentId);
    await collection.save();

    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
