const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.route("/profile")
  .get(protect, userController.getUserProfile)
  .put(protect, userController.updateUserProfile);

router.post("/watch-later", protect, userController.toggleWatchLater);
router.post("/watched", protect, userController.toggleWatched);

module.exports = router;
