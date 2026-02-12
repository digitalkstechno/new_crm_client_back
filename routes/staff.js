var express = require("express");
var router = express.Router();
let {
  createStaff,
  loginStaff,
  fetchAllStaffs,
  fetchStaffById,
  staffUpdate,
  staffDelete,
} = require("../controller/staff");
const authMiddleware = require("../middleware/auth");

router.post("/create", createStaff);
router.post("/login", loginStaff);
router.get("/", authMiddleware, fetchAllStaffs);
router.get("/:id", authMiddleware, fetchStaffById);
router.put("/:id", authMiddleware, staffUpdate);
router.delete("/:id", authMiddleware, staffDelete);

module.exports = router;