# main.py (excerpt)
import os, tempfile, json
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from yt_dlp import YoutubeDL
import whisper  # or faster-whisper if you switched

app = FastAPI()

TRANSCRIBER_SHARED_SECRET = os.environ.get("TRANSCRIBER_SHARED_SECRET", "")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "tiny")  # tiny/base small...
YOUTUBE_COOKIE = os.environ.get("YOUTUBE_COOKIE", "").strip()
YOUTUBE_COOKIES_TXT = os.environ.get("YOUTUBE_COOKIES_TXT", "").strip()

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36")

model = whisper.load_model(WHISPER_MODEL)

class UrlBody(BaseModel):
    url: str

def verify_secret(x_secret: str | None):
    if TRANSCRIBER_SHARED_SECRET and x_secret != TRANSCRIBER_SHARED_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")

@app.post("/transcribe_url")
def transcribe_url(body: UrlBody, x_secret: str | None = Header(default=None)):
    verify_secret(x_secret)
    url = body.url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="invalid url")

    with tempfile.TemporaryDirectory() as td:
        outtmpl = os.path.join(td, "audio.%(ext)s")

        # Build yt-dlp options with cookies + UA
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": outtmpl,
            "noplaylist": True,
            "noprogress": True,
            "quiet": True,
            "no_warnings": True,
            "http_headers": {"User-Agent": UA},  # always set UA
            # Optional: choose client variations if needed
            # "extractor_args": {"youtube": {"player_client": ["web"]}},
        }

        # Prefer cookies.txt if provided
        cookiefile_path = None
        if YOUTUBE_COOKIES_TXT:
            cookiefile_path = os.path.join(td, "cookies.txt")
            with open(cookiefile_path, "w") as f:
                f.write(YOUTUBE_COOKIES_TXT)
            ydl_opts["cookiefile"] = cookiefile_path
        elif YOUTUBE_COOKIE:
            # Fall back to single Cookie header
            ydl_opts.setdefault("http_headers", {})["Cookie"] = YOUTUBE_COOKIE

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filepath = ydl.prepare_filename(info)

            # If extension changed, pick the actual file
            base, _ = os.path.splitext(filepath)
            for ext in (".m4a", ".webm", ".opus", ".mp3"):
                cand = base + ext
                if os.path.exists(cand):
                    filepath = cand
                    break

            # Transcribe
            result = model.transcribe(filepath)
            return {
                "text": result.get("text", ""),
                "segments": result.get("segments", []),
            }
        except Exception as e:
            print("yt-dlp/whisper failed:", repr(e))
            raise HTTPException(status_code=500, detail="transcribe_url failed")
