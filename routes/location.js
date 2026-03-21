const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getCountries, getStates, getCities, upsertLocation } = require("../controller/location");

router.get("/countries", auth, getCountries);
router.get("/countries/:countryId/states", auth, getStates);
router.get("/states/:stateId/cities", auth, getCities);
router.post("/upsert", auth, upsertLocation);

module.exports = router;
