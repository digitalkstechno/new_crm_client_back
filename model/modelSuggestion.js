let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let modelSuggestionSchema = new Schema(
  {
    modelNo: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Color'
    },
    rate: {
      type: String,
    },
    gst: {
      type: Number,
      required: true,
      default: 18,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'InquiryCategory'
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

let MODELSUGGESTION = mongoose.model("ModelSuggestion", modelSuggestionSchema);
module.exports = MODELSUGGESTION;
