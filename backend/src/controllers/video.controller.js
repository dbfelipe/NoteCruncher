const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const youtubedl = require("youtube-dl-exec");
const { generateFlashcards } = require("./flashcard.controller");
const { execSync } = require("child_process");

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
const processVideo = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required." });
  }

  const videoId = uuidv4();
  const uploadDir = path.join(__dirname, "..", "uploads");

  try {
    // 1. Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Download best audio using yt-dlp
    await youtubedl(
      url,
      {
        format: "bestaudio",
        output: `${videoId}.%(ext)s`,
        paths: { home: uploadDir },
      },
      { cwd: uploadDir }
    ); // 👈 force yt-dlp to write here
    console.log("[DEBUG] Upload dir:", uploadDir);

    // 3. Find the downloaded file (.webm, .m4a, etc.)
    const downloadedFile = fs
      .readdirSync(uploadDir)
      .find((f) => f.startsWith(videoId));
    if (!downloadedFile) {
      return res
        .status(500)
        .json({ error: "Failed to find downloaded audio file." });
    }

    const originalPath = path.join(uploadDir, downloadedFile);
    const mp3Path = path.join(uploadDir, `${videoId}.mp3`);

    // 4. Convert to .mp3 using ffmpeg
    execSync(
      `ffmpeg -i "${originalPath}" -vn -ar 44100 -ac 2 -b:a 192k "${mp3Path}"`
    );

    // 5. Transcribe audio using Whisper FastAPI
    const form = new FormData();
    form.append("file", fs.createReadStream(mp3Path));

    const whisperRes = await axios.post(
      "http://localhost:5001/transcribe",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const transcript = whisperRes.data.transcript;

    // 6. Generate flashcards with OpenAI
    const flashcards = await generateFlashcards(transcript);

    // 7. Clean up files
    fs.unlinkSync(originalPath);
    fs.unlinkSync(mp3Path);

    // 8. Return result
    res.status(200).json({
      source: "youtube",
      transcript,
      flashcards,
    });
  } catch (err) {
    console.error("Error processing YouTube video:", err);
    res.status(500).json({ error: "Failed to process YouTube video." });
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

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    // Whisper Transcription
    const response = await axios.post(
      "http://localhost:5001/transcribe",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const transcript = response.data.transcript;

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
