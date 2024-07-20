const express = require("express");
const router = express.Router();
const controllerForgotPassword = require("../controllers/controllerForgotPassword");

router.post("/", controllerForgotPassword.forgotPassword);

module.exports = router;
