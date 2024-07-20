const express = require("express");
const router = express.Router();
const manhwaController = require("../controllers/controllerScanBot");
const verifyRoles = require("../middleware/verifyRoles");
const ROLES_LIST = require("../config/roles_list");
router.get("/methods/get/all", manhwaController.getAllManhwa);
router.get("/methods/get/manhwa", manhwaController.getManhwaData);
router.get("/methods/get/images/:id", manhwaController.getImages);
router.get("/methods/get/:search", manhwaController.getManhwaBySearch);
router.get("/methods/get/manhwa/:id", manhwaController.getManhwaBasedOnId);
router.get(
	"/methods/get/site/:scanlation",
	manhwaController.getManhwaByScanlation
);
router.get(
	"/methods/get/site/:scanlation/:search",
	manhwaController.getManhwaByScanlationAndSearch
);
router.patch(
	"/methods/patch/all/:scanlation",
	verifyRoles(ROLES_LIST.Admin),
	manhwaController.patchManhwaChapterAllScanlation
);
router.post(
	"/methods/post/add",
	verifyRoles(ROLES_LIST.Admin),
	manhwaController.addManhwa
);
router.post(
	"/methods/post/addAll",
	verifyRoles(ROLES_LIST.Admin),
	manhwaController.addAllManhwa
);

module.exports = router;
