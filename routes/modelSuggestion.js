var express = require("express");
var router = express.Router();
let {
  createmodelSuggestion,
  fetchAllModelSuggestions,
  fetchmodelSuggestionById,
  ModelSuggestionUpdate,
  ModelSuggestionDelete,
} = require("../controller/modelSuggestion");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, createmodelSuggestion);
router.get("/", authMiddleware, fetchAllModelSuggestions);
router.get("/:id", authMiddleware, fetchmodelSuggestionById);
router.put("/:id", authMiddleware, ModelSuggestionUpdate);
router.delete("/:id", authMiddleware, ModelSuggestionDelete);

module.exports = router;
