const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, reviewController.addReview);
router.get("/user", protect, reviewController.getUserReviews);
router.get("/content/:contentId", reviewController.getContentReviews);
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
