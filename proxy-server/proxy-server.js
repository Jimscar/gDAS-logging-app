const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
  origin: "https://gdas-logging-app-frontend.onrender.com", // ✅ Only allow your frontend
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVqb8Eb4MDTFfnRX-DPUsH849D93i0hqjBAPh4kY-PjR_unHMyNUT1AC19b0ovMjta8w/exec";

app.post("/proxy", async (req, res) => {
  console.log("📨 Received payload:", req.body);
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const result = await response.text();
    console.log("✅ Response from Apps Script:", result);
    res.send(result);
  } catch (error) {
    console.error("❌ Proxy error:", error);
    res.status(500).send("Proxy error: " + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
