let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let inquiryCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Inquiry Category Name is Required"],
      unique: true,
    },
  },
  { timestamps: true },
);

let INQUIRYCATEGORY = mongoose.model("InquiryCategory", inquiryCategorySchema);
module.exports = INQUIRYCATEGORY;
