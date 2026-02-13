let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let modelSuggestionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    modelNo: {
      type: String,
      required: true,
      unique: true,
    },
    rate: {
      type: String,
      required: true,
    },
    gst: {
      type: Number,
      required: true,
      default: 18,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref : 'InquiryCategory'
    },
  },
  { timestamps: true },
);

let MODELSUGGESTION = mongoose.model("ModelSuggestion", modelSuggestionSchema);
module.exports = MODELSUGGESTION;
