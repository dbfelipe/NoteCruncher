require("dotenv").config();

console.log("[env] TRANSCRIBER_URL =", process.env.TRANSCRIBER_URL);
console.log(
  "[env] TRANSCRIBER_SHARED_SECRET =",
  (process.env.TRANSCRIBER_SHARED_SECRET || "").slice(0, 4) + "***"
);

const app = require("./app");
const express = require("express");
const PORT = process.env.PORT || 3001;

const path = require("path");
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
