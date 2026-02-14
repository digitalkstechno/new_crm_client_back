let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let StaffSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is Required"],
    },
    email: {
      type: String,
      required: [true, "Email is Required"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Phone Number is Required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is Required"],
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

let STAFF = mongoose.model("Staff", StaffSchema);
module.exports = STAFF;
