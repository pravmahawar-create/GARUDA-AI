const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🦅 GARUDA AI Server is Running Successfully!");
});

app.listen(PORT, () => {
  console.log(`🚀 GARUDA AI running on http://localhost:${PORT}`);
});