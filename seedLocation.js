const mongoose = require("mongoose");
require("dotenv").config();
const { Country, State, City } = require("country-state-city");
const Location = require("./model/location");

async function seedLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Location.deleteMany({});
    console.log("🗑️  Cleared existing location data");

    const countries = Country.getAllCountries();
    console.log(`📦 Total countries to seed: ${countries.length}`);

    let seeded = 0;

    for (const country of countries) {
      const states = State.getStatesOfCountry(country.isoCode);

      const statesWithCities = states.map((state) => {
        const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
        return {
          name: state.name,
          isoCode: state.isoCode,
          cities: cities.map((c) => ({ name: c.name })),
        };
      });

      await Location.create({
        name: country.name,
        isoCode: country.isoCode,
        states: statesWithCities,
      });

      seeded++;
      if (seeded % 25 === 0) {
        console.log(`⏳ Seeded ${seeded}/${countries.length} countries...`);
      }
    }

    console.log(`✅ Successfully seeded all ${seeded} countries with states and cities!`);
    mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding locations:", error);
    process.exit(1);
  }
}

seedLocations();
