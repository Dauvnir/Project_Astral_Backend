const express = require("express");
const router = express.Router();
const controllerResetPassword = require("../controllers/controllerResetPassword");

router.get("/:id/:token", controllerResetPassword.verifyReset);
router.post("/:id/:token", controllerResetPassword.resetPassword);
module.exports = router;
