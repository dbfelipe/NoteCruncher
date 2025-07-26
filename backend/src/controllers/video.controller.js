const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const youtubedl = require("youtube-dl-exec");
const { generateFlashcards } = require("./flashcard.controller");

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
  console.log("[DEBUG] req.body:", req.body);
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Video URL is required" });
  }
  try {
    //Create a unique ID to name the file
    const videoId = uuidv4();
    const uploadDir = path.join(__dirname, "..", "uploads");
    const outputPath = path.join(uploadDir, `${videoId}.%(ext)s`); // 👈 notice %(ext)s
    const actualOutputPath = path.join(uploadDir, `${videoId}.mp3`);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const info = await youtubedl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      paths: { home: uploadDir }, // tells yt-dlp where to save
      output: `${videoId}.%(ext)s`, // filename format (relative to paths.home)
      dumpSingleJson: true,
    });

    const videoTitle = info.title || `YouTube Audio (${videoId})`;
    //Creates a multipart/form-data payload with the downloaded file, to send to the FastAPI transcribe
    const form = new FormData();
    form.append("file", fs.createReadStream(actualOutputPath));

    //sending the audion file to our FastAPI Whisper service
    const response = await axios.post(
      "http://localhost:5001/transcribe",
      form,
      {
        headers: form.getHeaders(),
      }
    );
    //recieves transcript
    const transcript = response.data.transcript;

    //Generate flashcards from transcript
    let flashcards;
    try {
      flashcards = await generateFlashcards(transcript);
    } catch (err) {
      console.error("Failed to generate flashcards:", err);
      return res.status(500).json({ error: "Flashcard generation failed." });
    }
    res.status(200).json({
      source: "youtube",
      title: videoTitle,
      transcript,
      flashcards,
    });
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Failed to process video." });
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
