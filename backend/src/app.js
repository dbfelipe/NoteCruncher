// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { pool } = require("./db"); // <- single shared pool
const videoRoutes = require("./routes/video.routes");
const flashcardRoutes = require("./routes/flashcard.routes");
const folderRoutes = require("./routes/folder.routes");
const setRoutes = require("./routes/set.routes");

// If your middleware files are under src/middleware/, use those paths:
const { requireAuth } = require("./middleware/auth");
const ensureDbUser = require("./middleware/ensureDbUser");

const app = express();

// Security & core middleware

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Make the DB available to routes if you like
app.locals.db = pool;

// Public routes
app.use("/api/videos", videoRoutes);

// Auth-protected, per-user routes
app.use("/api/folders", requireAuth, ensureDbUser(pool), folderRoutes);
app.use("/api/sets", requireAuth, ensureDbUser(pool), setRoutes);
app.use("/api/flashcards", requireAuth, ensureDbUser(pool), flashcardRoutes);

// Health checks
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const transcriberUrl = process.env.TRANSCRIBER_URL;
    const secret = process.env.TRANSCRIBER_SHARED_SECRET;

    // Send URL to your transcriber (if transcriber expects an uploaded file, adjust accordingly)
    const response = await fetch(`${transcriberUrl}/transcribe`, {
      method: "POST",
      headers: {
        "x-secret": secret,
        "content-type": "application/json",
      },
      body: JSON.stringify({ source_type: "youtube", url }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Transcriber error ${response.status}: ${text}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("Transcriber error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
