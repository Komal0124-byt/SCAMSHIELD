const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  message: String,
  result: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Scan", scanSchema);