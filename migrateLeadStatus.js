const mongoose = require("mongoose");
require("dotenv").config();

const LEAD = require("./model/lead");

async function migrateLeadStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await LEAD.updateMany(
      { leadStatus: "Follow Remark" },
      { $set: { leadStatus: "Follow Up" } }
    );

    console.log(`✅ Migration completed: ${result.modifiedCount} leads updated`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateLeadStatus();
