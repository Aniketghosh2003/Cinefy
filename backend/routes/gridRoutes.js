const express = require("express");
const router = express.Router();
const gridController = require("../controllers/gridController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, gridController.createGrid);
router.get("/", gridController.getAllGrids);
router.get("/all", gridController.getAllGrids);
router.get("/mine", protect, gridController.getMyGrids);
router.get("/my-likes", protect, gridController.getUserLikes);
router.post("/:id/like", protect, gridController.toggleLike);

module.exports = router;
