// db.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
require("dotenv").config();

const caRaw = fs.readFileSync(
  path.join(__dirname, "certs", "rds-global-bundle.pem"),
  "utf8"
);
const caArray = caRaw
  .split(/-----END CERTIFICATE-----/g)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s + "\n-----END CERTIFICATE-----\n");

const u = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: u.hostname,
  port: Number(u.port || 5432),
  database: u.pathname.slice(1),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password || ""),
  ssl: { ca: caArray, rejectUnauthorized: true, servername: u.hostname },
});

module.exports = { pool };
