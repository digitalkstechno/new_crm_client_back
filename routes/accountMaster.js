var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createAccountMaster,
  fetchAllAccountMaster,
  fetchAccountMasterById,
  updateAccountMaster,
  deleteAccountMaster,
} = require("../controller/accountMaster");

router.post("/", authMiddleware, createAccountMaster);
router.get("/", authMiddleware, fetchAllAccountMaster);
router.get("/:id", authMiddleware, fetchAccountMasterById);
router.put("/:id", authMiddleware, updateAccountMaster);
router.delete("/:id", authMiddleware, deleteAccountMaster);

module.exports = router;
