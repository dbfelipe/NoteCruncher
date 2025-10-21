const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
//const youtubedl = require("youtube-dl-exec");
const { generateFlashcards } = require("./flashcard.controller");
//const { execSync } = require("child_process");

const ytdl = require("ytdl-core");

const TRANSCRIBER_URL = process.env.TRANSCRIBER_URL;
const TRANSCRIBER_SHARED_SECRET = process.env.TRANSCRIBER_SHARED_SECRET;

//Function to get all summaries from the database
const getAllSummaries = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      "SELECT * FROM summaries ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching summaries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Function to get a single summary by ID
const getSummaryById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = req.app.locals.db;
    const result = await db.query("SELECT * FROM summaries WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Summary not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Function to process a video URL
async function downloadAudioToFile(youtubeUrl, outPath) {
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(outPath);
    ytdl(youtubeUrl, { filter: "audioonly", quality: "highestaudio" })
      .on("error", reject)
      .pipe(ws)
      .on("finish", resolve)
      .on("error", reject);
  });
}

exports.processVideo = async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "YouTube URL is required." });

  const id = uuidv4();
  const uploadDir = path.join(__dirname, "..", "uploads");
  const audioExt = "webm";
  const audioPath = path.join(uploadDir, `${id}.${audioExt}`);

  // Ensure env looks sane
  if (!TRANSCRIBER_URL || !TRANSCRIBER_SHARED_SECRET) {
    console.error(
      "[youtube] Missing TRANSCRIBER_URL or TRANSCRIBER_SHARED_SECRET"
    );
    return res
      .status(500)
      .json({ error: "Server misconfigured (transcriber env)." });
  }

  try {
    // Ensure uploads dir exists
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Optional: cap length to avoid huge downloads
    try {
      const info = await ytdl.getInfo(url);
      const secs = Number(info?.videoDetails?.lengthSeconds || 0);
      console.log(
        `[youtube] title="${info?.videoDetails?.title}" length=${secs}s`
      );
      if (secs > 60 * 60) {
        return res
          .status(400)
          .json({ error: "Video too long (limit 60 minutes)." });
      }
    } catch (e) {
      console.warn(
        "[youtube] getInfo failed; continuing to attempt download:",
        e?.message
      );
    }

    // Download audio
    console.log(`[youtube] downloading audio -> ${audioPath}`);
    await downloadAudioToFile(url, audioPath);
    const stat = fs.statSync(audioPath);
    console.log(`[youtube] download complete size=${stat.size} bytes`);

    // Send to transcriber as multipart
    const form = new FormData();
    form.append("file", fs.createReadStream(audioPath), `audio.${audioExt}`);

    console.log(
      `[youtube] posting to transcriber: ${TRANSCRIBER_URL}/transcribe`
    );
    const r = await axios.post(`${TRANSCRIBER_URL}/transcribe`, form, {
      headers: {
        ...form.getHeaders(),
        "x-secret": TRANSCRIBER_SHARED_SECRET,
      },
      maxBodyLength: Infinity, // <-- large uploads
      timeout: 300000, // <-- 5 min for longer clips/models
      validateStatus: () => true, // we'll handle manually below
    });

    // Clean up temp file
    try {
      fs.unlinkSync(audioPath);
    } catch {}

    if (r.status < 200 || r.status >= 300) {
      const detail =
        typeof r.data === "string" ? r.data : JSON.stringify(r.data);
      console.error(`[youtube] transcriber error ${r.status}: ${detail}`);
      return res.status(502).json({ error: `Transcriber ${r.status}`, detail });
    }

    const transcript = r.data?.text || r.data?.transcript || "";
    if (!transcript) {
      console.error("[youtube] transcriber returned no text field:", r.data);
      return res
        .status(502)
        .json({ error: "Transcriber returned no transcript." });
    }

    // TODO: replace this with your real flashcard generator
    // const flashcards = await generateFlashcards(transcript);
    const flashcards = []; // temporary

    return res.json({ source: "youtube", transcript, flashcards });
  } catch (err) {
    console.error("[youtube] failed:", err?.stack || err?.message || err);
    try {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    } catch {}
    return res.status(500).json({ error: "Failed to process YouTube video." });
  }
};

//Function to handle upload audio/video file
// Handle file upload (audio/video)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(__dirname, "..", "uploads", req.file.filename);

    // Whisper Transcription
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${TRANSCRIBER_URL}/transcribe`, form, {
      headers: {
        ...form.getHeaders(),
        "x-secret": TRANSCRIBER_SHARED_SECRET,
      },
      maxBodyLength: Infinity,
    });

    const transcript = response.data.text || response.data.transcript;

    // OpenAI Summarization
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes lecture transcripts for students.",
          },
          {
            role: "user",
            content: `Summarize the following transcript in clear, concise study notes make sure the summary covers most all topics discussed, dont be too brief:\n\n${transcript}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = openaiResponse.data.choices[0].message.content;

    // Save to database
    const db = req.app.locals.db;
    const result = await db.query(
      "INSERT INTO summaries (title, summary, transcript) VALUES ($1, $2, $3) RETURNING *",
      ["Uploaded File", summary, transcript]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to process file upload" });
  }
};

module.exports = {
  getAllSummaries,
  getSummaryById,
  processVideo,
  uploadFile,
};
