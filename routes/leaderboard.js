const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/controllerLeaderboard");

router.get("/", leaderboardController.getLeaderboard);

module.exports = router;
