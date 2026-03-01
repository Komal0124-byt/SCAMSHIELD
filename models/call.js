const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    type: { type: String, enum: ["scam", "safe"], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);