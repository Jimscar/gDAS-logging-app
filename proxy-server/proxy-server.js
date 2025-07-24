const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = "https://gdas-logging-app-frontend.onrender.com";

// ✅ Set CORS headers for all incoming requests *before* anything else
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Respond immediately to preflight
  }
  next();
});

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

app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("✅ Proxy is live and CORS headers are being set.");
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
"// test webhook" 
