from pathlib import Path

# Define the content of the system design markdown

system_design_md = """# 🧠 NoteCrunch System Design Overview

## 🔍 Overview

NoteCrunch is a web application that allows users to upload `.mp3` files or paste YouTube links to generate smart summaries (and soon, flashcards) using AI transcription and OpenAI summarization.

---

## 🧱 Architecture

### 🎛️ Frontend (React)

- **Handles:** User interaction, file uploads, YouTube URL input
- **Key Features:**
  - Progress bars
  - File and URL-based upload support
  - Summary display
- **Port:** `3000`

### 🔧 Backend (Express.js)

- **Handles:** API routing, file handling, DB interaction, external API calls
- **Endpoints:**
  - `POST /api/videos/upload` → handles file uploads
  - `POST /api/videos/youtube` → handles YouTube links via `yt-dlp`
- **Tech Used:**
  - `multer` for file parsing
  - `pg` for PostgreSQL DB interaction
  - `youtube-dl-exec` for YouTube audio extraction
- **Port:** `3001`

### 🧠 Transcriber (FastAPI)

- **Handles:** Whisper-based transcription
- **Endpoint:** `POST /transcribe`
- **Port:** `5001`

---

## ⚙️ Data Flow

### File Upload

1. Frontend sends `.mp3` to `/api/videos/upload`
2. Backend saves it, sends to FastAPI
3. FastAPI returns transcript
4. Backend sends transcript to OpenAI
5. Summary is saved and returned

### YouTube Link

1. Frontend sends `url` to `/api/videos/youtube`
2. Backend uses `yt-dlp` to download and save `.mp3`
3. Backend sends file to FastAPI
4. FastAPI returns transcript
5. Backend sends transcript to OpenAI
6. Summary is saved and returned

---

## 🗃️ Database Schema (PostgreSQL)

```sql
CREATE TABLE summaries (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255),
  video_url TEXT,
  title TEXT,
  summary TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
