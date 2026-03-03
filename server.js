
require('dns').setServers(['8.8.8.8','8.8.8.4']);
const Scan = require("./models/scan");
const express = require("express");
const cors = require("cors");

const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

  const lowerMsg = message.toLowerCase();

app.post("/check", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ result: "Please enter a message." });
  }

  const lowerMsg = message.toLowerCase();

  const scamKeywords = [
    "win",
    "lottery",
    "prize",
    "money",
    "click",
    "link",
    "otp",
    "urgent",
    "account",
    "verify",
    "bank"
  ];

  let isScam = scamKeywords.some(keyword =>
    lowerMsg.includes(keyword)
  );

  const result = isScam
    ? "⚠️ This looks like a Scam!"
    : "✅ This message looks Safe.";

  try {
    await Scan.create({ message, result });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "Database save failed" });
  }
});
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
  const { number, type, notes } = req.body;

  if (!number) {
    return res.status(400).json({ message: "Number required" });
  }

  const lowerNotes = notes ? notes.toLowerCase() : "";

  // ✅ OTP word auto scam mark
  let finalType = type;
  if (lowerNotes.includes("otp")) {
    finalType = "scam";
  }

  try {
    // ✅ Check duplicate number
    const existingCall = await Call.findOne({ number });

    if (existingCall) {
      return res.json({
        message: "⚠️ Number already exists in database!",
        existing: existingCall,
      });
    }

    const newCall = await Call.create({
      number,
      type: finalType,
      notes,
    });

    res.json({
      message: "Call added successfully",
      data: newCall,
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to add call" });
  }
});  


app.get("/calls/check/:number", async (req, res) => {
  const { number } = req.params;

  try {
    const call = await Call.findOne({ number });

    if (!call) {
      return res.json({
        status: "unknown",
        message: "No record found for this number.",
      });
    }

    if (call.type === "scam") {
      return res.json({
        status: "scam",
        message: "⚠️ Warning! This number is reported as Scam.",
      });
    }

    return res.json({
      status: "safe",
      message: "✅ This number is marked Safe.",
    });

  } catch (err) {
    res.status(500).json({ error: "Check failed" });
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