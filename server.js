
require('dns').setServers(['8.8.8.8','8.8.8.4']);
const Scan = require("./models/scan");
const express = require("express");
const cors = require("cors");

const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend Connected Successfully 🚀" });
});

app.post("/check", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ result: "Please enter a message." });
  }

  let result;

  const lowerMsg = message.toLowerCase();

if (
  lowerMsg.includes("win") ||
  lowerMsg.includes("prize") ||
  lowerMsg.includes("lottery") ||
  lowerMsg.includes("money") ||
  lowerMsg.includes("claim")
) {
  result = "⚠️ This looks like a Scam!";
} else {
  result = "✅ This message looks Safe.";
}

  try {
    await Scan.create({ message, result });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "Database save failed" });
  }
});
app.get("/history", async (req, res) => {
  try {
    const history = await Scan.find()
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
const Call = require("./models/call");

// Add new call
app.post("/calls/add", async (req, res) => {
  try {
    const { number, type, notes } = req.body;
    const call = new Call({ number, type, notes });
    await call.save();
    res.json({ message: "Call saved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save call" });
  }
});

// Get call history
app.get("/calls/history", async (req, res) => {
  try {
    const calls = await Call.find().sort({ createdAt: -1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch calls" });
  }
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});