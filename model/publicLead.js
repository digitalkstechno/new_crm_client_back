const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const publicLeadSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    attachments: [{ type: String }],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PUBLICLEAD = mongoose.model("PublicLead", publicLeadSchema);
module.exports = PUBLICLEAD;
