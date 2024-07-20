const express = require("express");
const router = express.Router();
const registerController = require("../controllers/controllerRegister");
router.post("/", registerController.createUser);

module.exports = router;
