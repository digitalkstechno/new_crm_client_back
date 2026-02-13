let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let accountMasterSchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    address: {
      line1: String,
      line2: String,
      cityName: String,
      stateName: String,
      countryName: String,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,
    },
    sourcebyTypeOfClient: {
      type: String,
      required: true,
      enum: [
        "B to B Vendor",
        "Direct Com",
        "Networking Group",
        "EndUser Retail",
        "O.E.M",
      ],
    },
    sourceFrom: {
      type: String,
    },
    assignBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    remark: {
      type: String,
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

let ACCOUNTMASTER = mongoose.model("AccountMaster", accountMasterSchema);
module.exports = ACCOUNTMASTER;
