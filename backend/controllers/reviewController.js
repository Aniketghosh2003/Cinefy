const Review = require("../models/Review");

// Add or Update Review
exports.addReview = async (req, res) => {
  try {
    const { contentId, worthScore, comment } = req.body;
    const userId = req.user.id;

    // Check if review already exists
    let review = await Review.findOne({ userId, contentId });

    if (review) {
      // Update existing review
      review.worthScore = worthScore;
      review.comment = comment;
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        userId,
        contentId,
        worthScore,
        comment,
      });
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Reviews for specific content
exports.getContentReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ contentId: req.params.contentId })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Ensure user owns the review
    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await review.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
