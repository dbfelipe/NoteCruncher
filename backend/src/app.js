const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Pool } = require("pg");
const videoRoutes = require("./routes/video.routes");
const flashcardRoutes = require("./routes/flashcard.routes");
const folderRoutes = require("./routes/folder.routes");
const setRoutes = require("./routes/set.routes");

require("dotenv").config();

const app = express();

const { createRemoteJWKSet, jwtVerify } = require("jose");

const region = "us-east-1";
const userPoolId = "us-east-1_0T8LoEjmQ"; // from Cognito
const clientId = "13nv4ai8cbg027cksfn4651qn9"; // SPA client ID

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: clientId,
    });
    if (payload.token_use !== "access") {
      return res.status(401).json({ error: "Invalid token use" });
    }

    req.user = payload; // { sub, email, ... }
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

//requiring login for folder and set endpoints
//app.use("/api/folders", requireAuth, folderRoutes);
//app.use("/api/sets", requireAuth, setRoutes);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000", // React dev server
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

//Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "video_summarizer",
});
//Make the database connection available to all routes
app.locals.db = pool;
//Routes
app.use("/api/videos", videoRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/sets", setRoutes);

//Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

//Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
