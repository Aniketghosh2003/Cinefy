const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

// Home Page Sections (Direct from TMDB/Jikan)
router.get("/trending", contentController.getTrending);

// Search
router.get("/search", contentController.searchContent);

// Smart Recommendations (From local DB cache)
router.get("/recommendations", contentController.getRecommendations);

// Lazy Caching details route
router.get("/details/:source/:externalId", contentController.getContentDetails);

// Keep these if you want to use local DB for these features later
router.get("/top", contentController.getTop);
router.get("/ongoing", contentController.getOngoing);
router.get("/upcoming", contentController.getUpcoming);

module.exports = router;
