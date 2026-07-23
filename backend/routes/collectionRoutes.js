const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collectionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, collectionController.createCollection);
router.get("/", collectionController.getAllCollections);
router.get("/all", collectionController.getAllCollections);
router.get("/mine", protect, collectionController.getMyCollections);
router.post("/add-item", protect, collectionController.addItemToCollection);
router.get("/:id", collectionController.getCollectionById);
router.post("/:id/like", protect, collectionController.toggleLike);

module.exports = router;
