const express = require("express");
const router = express.Router();
const authorizedController = require("../controllers/controllerLogout");
router.get("/", authorizedController.handleLogout);

module.exports = router;
