var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/staff", require("./staff"));
router.use("/inquirycategory", require("./inquiryCategory"));
router.use("/model", require("./modelSuggestion"));
router.use("/accountmaster", require("./accountMaster"));
router.use("/lead", require("./lead"));

module.exports = router;
