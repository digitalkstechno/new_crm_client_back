const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({ name: { type: String, required: true } });

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isoCode: { type: String },
  cities: [citySchema],
});

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isoCode: { type: String },
  states: [stateSchema],
});

module.exports = mongoose.model("Location", countrySchema);
