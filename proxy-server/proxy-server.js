const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 4000;

// ✅ Your deployed Google Apps Script Web App URL (must end in /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVqb8Eb4MDTFfnRX-DPUsH849D93i0hqjBAPh4kY-PjR_unHMyNUT1AC19b0ovMjta8w/exec";

// Middleware
app.use(cors());
app.use(express.json());

// Proxy POST route
app.post("/proxy", async (req, res) => {
  console.log("📨 Received payload:", req.body);
  console.log("📡 Proxy forwarding to:", SCRIPT_URL);

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const result = await response.text();
    console.log("✅ Response from Apps Script:", result);

    res.send(result); // Send result back to React app
  } catch (error) {
    console.error("❌ Proxy error:", error);
    res.status(500).send("Proxy error: " + error.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server listening at http://localhost:${PORT}`);
});
