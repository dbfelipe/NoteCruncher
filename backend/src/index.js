require("dotenv").config();

const app = require("./app");
const express = require("express");
const PORT = process.env.PORT || 3001;

const path = require("path");
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
