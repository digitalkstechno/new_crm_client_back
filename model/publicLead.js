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
    document: {
      fileName: { type: String },       // original file name
      filePath: { type: String },       // path where file is stored
      fileType: { type: String },       // mimetype e.g. image/png
      fileSize: { type: Number },       // size in bytes
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
