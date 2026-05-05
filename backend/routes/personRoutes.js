const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");

router.get("/:source/:externalId", personController.getPersonDetails);

module.exports = router;
