const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);
router.post("/google", authController.googleLogin);
router.get("/google/url", authController.getGoogleAuthUrl);
router.get("/google/callback", authController.handleGoogleCallback);

module.exports = router;
