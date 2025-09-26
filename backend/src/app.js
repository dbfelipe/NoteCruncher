const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Pool } = require("pg");
const videoRoutes = require("./routes/video.routes");
const flashcardRoutes = require("./routes/flashcard.routes");
const folderRoutes = require("./routes/folder.routes");
const setRoutes = require("./routes/set.routes");
const { requireAuth } = require("./middleware/auth");
const ensureDbUser = require("./middleware/ensureDbUser");

require("dotenv").config();

const app = express();

const { createRemoteJWKSet, jwtVerify } = require("jose");

const region = "us-east-1";
const userPoolId = "us-east-1_0T8LoEjmQ"; // from Cognito
const clientId = "13nv4ai8cbg027cksfn4651qn9"; // SPA client ID

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

//requiring login for folder and set endpoints
//app.use("/api/folders", requireAuth, folderRoutes);
//app.use("/api/sets", requireAuth, setRoutes);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://YOUR-frontend-domain.com"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(express.json());

//Database connection
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // dev-friendly on RDS; tighten later
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "video_summarizer",
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
//Make the database connection available to all routes
app.locals.db = pool;
//Routes
app.use("/api/videos", videoRoutes);

//Mounting all routes that should be per user
const db = app.locals.db;
app.use("/api/folders", requireAuth, ensureDbUser(db));
app.use("/api/sets", requireAuth, ensureDbUser(db));
app.use("/api/flashcards", requireAuth, ensureDbUser(db));

// ..then existing routeres
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/folders", requireAuth, folderRoutes);
app.use("/api/sets", requireAuth, setRoutes);

//Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await app.locals.db.query("select 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

//Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
