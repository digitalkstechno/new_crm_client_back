var express = require("express");
var router = express.Router();
const multer = require('multer');
const createUploader = require("../utils/multer");
const upload = createUploader("uploads/publicLeads");
// const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../middleware/auth");
const {
  createAccountMaster,
  fetchAllAccountMaster,
  fetchAccountMasterById,
  updateAccountMaster,
  deleteAccountMaster,
  downloadSampleExcel,
  exportAccountMaster,
  importAccountMaster,
  createPublicAccountMaster,
  createPublicLead,
  fetchAllPublicLeads,
  exportPublicLeads,
  deletePublicLead
} = require("../controller/accountMaster");

router.post("/public", createPublicAccountMaster);
router.post("/public-lead", upload.array("attachments"), createPublicLead);
router.get("/public-lead", fetchAllPublicLeads);
router.get("/public-lead/export", authMiddleware, exportPublicLeads);
router.delete("/public-lead/:id", authMiddleware, deletePublicLead);
router.get("/sample-excel", authMiddleware, downloadSampleExcel);
router.get("/export", authMiddleware, exportAccountMaster);
router.post("/import", authMiddleware, upload.array("attachments"), importAccountMaster);
router.post("/", authMiddleware, createAccountMaster);
router.get("/", authMiddleware, fetchAllAccountMaster);
router.get("/:id", authMiddleware, fetchAccountMasterById);
router.put("/:id", authMiddleware, updateAccountMaster);
router.delete("/:id", authMiddleware, deleteAccountMaster);

module.exports = router;
