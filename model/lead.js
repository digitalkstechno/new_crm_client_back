let mongoose = require("mongoose");
let Schema = mongoose.Schema;

/* -------------------- ITEM SCHEMA -------------------- */

let itemSchema = new Schema(
  {
    inquiryCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InquiryCategory",
      required: true,
    },
    modelSuggestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelSuggestion",
      required: true,
    },
    qty: {type: String},
    rate: {type: String},
    gst: {type: String},
    shippingCharges:{type: String},
    total: {type: String},
    isDone : {type: Boolean},
    customizationType: {
      type: String,
      enum: [
        "Laser Engrave",
        "UV Color Logo",
        "Jingle Ad",
        "B.T Pair Name",
        "U.V. DTF Sticker",
        "Glow Logo",
        "O.E.M",
        "Other",
      ],
    },
    personalization: {
      isPersonalized: {
        type: Boolean,
        default: false,
      },
      location: String,
      description: String,
      name: String,
    },
  },
  { _id: true }
);

let remarkSchema = new Schema(
  {
    date: {type: Date, default: Date.now},
    remark : {type: String}
  }
)

let paymentSchema = new Schema({
    date : {type: Date, default: Date.now},
    amount : {type: String},
    modeOfPayment : {
      type: String,
      enum: ["Cash", "Cheque", "NEFT", "RTGS","DD"]
    },
    remark : {type: String}
  })

/* -------------------- LEAD SCHEMA -------------------- */

let leadSchema = new Schema(
  {
    leadDate: {
      type: Date,
      default: Date.now,
    },

    clientType: {
      type: String,
      enum: ["New", "Existing"],
    },

    deliveryDate: {
      type: Date,
    },

    accountMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMaster",
    },

    leadStatus: {
      type: String,
      enum: [
        "New Lead",
        "Quotation Given",
        "Follow Remark",
        "Order Confirmation",
        "PI",
        "Order Execution",
        "Dispatch",
        "Final Payment",
        "Completed",
        "Lost",
      ],
      default: "New Lead",
    },

    items: [itemSchema],
    remarks: [remarkSchema],
    paymentHistory: [paymentSchema],
    totalAmount : {type: String},
  },
  { timestamps: true }
);

let LEAD = mongoose.model("Lead", leadSchema);
module.exports = LEAD;
