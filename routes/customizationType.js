const express = require("express");
const router = express.Router();

const {
  createCustomizationType,
  fetchAllCustomizationTypes,
  fetchCustomizationTypeById,
  updateCustomizationType,
  deleteCustomizationType,
} = require("../controller/customizationType");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, createCustomizationType);
router.get("/", authMiddleware, fetchAllCustomizationTypes);
router.get("/:id", authMiddleware, fetchCustomizationTypeById);
router.put("/:id", authMiddleware, updateCustomizationType);
router.delete("/:id", authMiddleware, deleteCustomizationType);

module.exports = router;
