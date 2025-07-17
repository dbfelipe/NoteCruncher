const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

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
    return res.status(400).json({ error: "Video URL is required" });
  }
  try {
    //Check if the URL is a valid YouTube URL
    const isValid = await ytdl.validateURL(url);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    //Get video details
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;
    const videoId = videoInfo.videoDetails.videoId;

    //Here I need to implement my actaul transcription and summarization logic
    //For now ill just create a placeholder summary
    const placeholderSummary =
      "This is a placeholder summary for ${videoTitle}. In a real implentation you would process the audio transcribe it and generate a summary";

    //Store in the database
    const db = req.app.locals.db;
    const result = await db.query(
      "INSERT INTO summaries (video_id, video_url, title, summary) VALUES ($1, $2, $3, $4) RETURNING *"[
        (videoId, url, videoTitle, placeholderSummary)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Failed to proces video" });
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
