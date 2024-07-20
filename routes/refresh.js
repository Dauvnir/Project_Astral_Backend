const express = require("express");
const router = express.Router();
const authorizedController = require("../controllers/controllerRefreshToken");
router.get("/", authorizedController.handleRefreshToken);

module.exports = router;
