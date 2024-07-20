const express = require("express");
const router = express.Router();
const controllerContact = require("../controllers/controllerContact");

router.post("/", controllerContact.contactMe);

module.exports = router;
