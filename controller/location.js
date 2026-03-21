const Location = require("../model/location");

// GET all countries
exports.getCountries = async (req, res) => {
  try {
    const countries = await Location.find({}, "name isoCode").sort({ name: 1 });
    res.json({ status: "Success", data: countries });
  } catch (e) {
    res.status(500).json({ status: "Fail", message: e.message });
  }
};

// GET states by country
exports.getStates = async (req, res) => {
  try {
    const country = await Location.findById(req.params.countryId, "states.name states._id states.isoCode").lean();
    if (!country) return res.status(404).json({ status: "Fail", message: "Country not found" });
    const states = country.states.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ status: "Success", data: states });
  } catch (e) {
    res.status(500).json({ status: "Fail", message: e.message });
  }
};

// GET cities by state
exports.getCities = async (req, res) => {
  try {
    const country = await Location.findOne({ "states._id": req.params.stateId }, { "states.$": 1 }).lean();
    if (!country) return res.status(404).json({ status: "Fail", message: "State not found" });
    const cities = country.states[0].cities.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ status: "Success", data: cities });
  } catch (e) {
    res.status(500).json({ status: "Fail", message: e.message });
  }
};

// POST /location/upsert — called ONLY on account save
// Checks if country/state/city exists, adds if not, returns IDs
exports.upsertLocation = async (req, res) => {
  try {
    const { countryName, stateName, cityName } = req.body;

    if (!countryName) return res.json({ status: "Success", data: {} });

    // --- Country ---
    let country = await Location.findOne({ name: { $regex: `^${countryName}$`, $options: "i" } });
    if (!country) {
      country = await Location.create({ name: countryName, states: [] });
    }

    if (!stateName) {
      return res.json({ status: "Success", data: { countryId: country._id, countryName: country.name } });
    }

    // --- State ---
    let state = country.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (!state) {
      country.states.push({ name: stateName, cities: [] });
      await country.save();
      state = country.states[country.states.length - 1];
    }

    if (!cityName) {
      return res.json({ status: "Success", data: { countryId: country._id, countryName: country.name, stateId: state._id, stateName: state.name } });
    }

    // --- City ---
    let city = state.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (!city) {
      state.cities.push({ name: cityName });
      await country.save();
      // re-fetch to get the new city's _id
      const updated = await Location.findById(country._id);
      const updatedState = updated.states.id(state._id);
      city = updatedState.cities[updatedState.cities.length - 1];
      state = updatedState;
    }

    return res.json({
      status: "Success",
      data: {
        countryId: country._id,
        countryName: country.name,
        stateId: state._id,
        stateName: state.name,
        cityId: city._id,
        cityName: city.name,
      },
    });
  } catch (e) {
    res.status(500).json({ status: "Fail", message: e.message });
  }
};
