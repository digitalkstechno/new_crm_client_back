const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const publicLeadSchema = new Schema(
  {
    name: {
      type: String,
    },
    companyName: {
      type: String,
    },
    email: {
      type: String,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    attachments: [{ type: String }],
    typeofclient: { type: mongoose.Schema.Types.ObjectId, ref: "ClientType" },
    notes: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PUBLICLEAD = mongoose.model("PublicLead", publicLeadSchema);
module.exports = PUBLICLEAD;
