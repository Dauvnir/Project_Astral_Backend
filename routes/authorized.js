const express = require("express");
const router = express.Router();
const authorizedController = require("../controllers/controllerAuth");
router.post("/", authorizedController.handleLogin);

module.exports = router;
