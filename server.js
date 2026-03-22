require('dns').setServers(['8.8.8.8','8.8.4.4']);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Scan = require("./models/scan");
const Call = require("./models/call");
const urlRegex = /(https?:\/\/[^\s]+)/g;

const app = express();

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

  const lowerMsg = message.toLowerCase();

  // 🔴 1. Strong keyword list
  const scamKeywords = [
  "win", "lottery", "prize", "money",
  "click", "link", "otp", "urgent",
  "account", "verify", "bank",
  "alert", "login", "secure"
 ];

  // 🔴 2. Phishing trigger phrases
  const scamTriggers = [
  "confirm your information",
  "update your details",
  "click here",
  "urgent action required",
  "verify your account",
  "secure your account",
  "unusual sign-in attempt"
];

  // 🟢 Trusted domains
  const trustedDomains = [
    "fedex.com",
    "amazon.com",
    "flipkart.com",
    "paypal.com"
  ];

  // 🔍 Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.match(urlRegex) || [];

  // 🔍 Improved domain checker
  function isFakeDomain(url) {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return !trustedDomains.includes(domain);
    } catch {
      return true;
    }
  }

  // 🔥 3. Checks
  const hasKeyword = scamKeywords.some(k => lowerMsg.includes(k));
  const hasTrigger = scamTriggers.some(t => lowerMsg.includes(t));
  const hasFakeLink = urls.some(url => isFakeDomain(url));
  const hasAlertPattern =
  lowerMsg.includes("alert") &&
  (lowerMsg.includes("account") || lowerMsg.includes("login"));

  // ⚠️ 4. Risk scoring system (PRO FEATURE)
  let score = 0;

  if (hasKeyword) score += 1;
  if (hasTrigger) score += 2;
  if (hasFakeLink) score += 3;
  const isScam =
  hasKeyword ||
  hasTrigger ||
  hasFakeLink ||
  hasAlertPattern;

  // 🎯 5. Final decision
  let result = "";
  let riskLevel = "";

  if (score >= 4) {
    result = "🚨 High Risk Scam Detected!";
    riskLevel = "HIGH";
  } else if (score >= 2) {
    result = "⚠️ Suspicious Message!";
    riskLevel = "MEDIUM";
  } else {
    result = "✅ This message looks Safe.";
    riskLevel = "LOW";
  }

  try {

    await Scan.create({
      message,
      result,
      riskLevel,
      score
    });

    res.json({ result, riskLevel, score });

  } catch (err) {

    res.status(500).json({
      error: "Database save failed"
    });

  }

});
app.get("/history", async (req, res) => {

  try {

    const history = await Scan.find()
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json(history);

  } catch (err) {

    res.status(500).json({
      error: "Failed to fetch history"
    });

  }

});

app.post("/calls/add", async (req, res) => {

  const { number, type, notes } = req.body;

  if (!number) {
    return res.status(400).json({
      message: "Number required"
    });
  }

  const lowerNotes = notes ? notes.toLowerCase() : "";

  // OTP word auto scam
  let finalType = type;

  if (lowerNotes.includes("otp")) {
    finalType = "scam";
  }

  try {

    const existingCall = await Call.findOne({ number });

    if (existingCall) {
      return res.json({
        message: "⚠️ Number already exists in database!",
        existing: existingCall
      });
    }

    const newCall = await Call.create({
      number,
      type: finalType,
      notes
    });

    res.json({
      message: "Call added successfully",
      data: newCall
    });

  } catch (err) {

    res.status(500).json({
      error: "Failed to add call"
    });

  }

});

app.get("/calls/check/:number", async (req, res) => {

  const { number } = req.params;

  try {

    const call = await Call.findOne({ number });

    if (!call) {

      return res.json({
        status: "unknown",
        message: "No record found for this number."
      });

    }

    if (call.type === "scam") {

      return res.json({
        status: "scam",
        message: "⚠️ Warning! This number is reported as Scam."
      });

    }

    return res.json({
      status: "safe",
      message: "✅ This number is marked Safe."
    });

  } catch (err) {

    res.status(500).json({
      error: "Check failed"
    });

  }

});

app.get("/calls/history", async (req, res) => {

  try {

    const calls = await Call.find()
      .sort({ createdAt: -1 });

    res.json(calls);

  } catch (err) {

    res.status(500).json({
      error: "Failed to fetch calls"
    });

  }

});

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected ✅");
})
.catch(err => {
  console.log(err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});