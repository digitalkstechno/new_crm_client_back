const express = require("express");
const router = express.Router();

const {
  createLead,
  fetchAllLeads,
  fetchLeadById,
  updateLead,
  deleteLead,
  fetchLeadsByStatus,
} = require("../controller/lead");
const authMiddleware = require("../middleware/auth");
router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, fetchAllLeads);
router.get("/status/:status", authMiddleware, fetchLeadsByStatus);
router.get("/:id", authMiddleware, fetchLeadById);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);

module.exports = router;
