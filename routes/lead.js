const express = require("express");
const router = express.Router();

const {
  createLead,
  fetchAllLeads,
  fetchLeadById,
  updateLead,
  deleteLead,
  fetchLeadsByStatus,
  addFollowUp,
  toggleItemDone,
} = require("../controller/lead");
const authMiddleware = require("../middleware/auth");
router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, fetchAllLeads);
router.get("/status/:status", authMiddleware, fetchLeadsByStatus);
router.post("/:id/followup", authMiddleware, addFollowUp);
router.patch("/:id/item/:itemId/toggle", authMiddleware, toggleItemDone);
router.get("/:id", authMiddleware, fetchLeadById);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);

module.exports = router;
