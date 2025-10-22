# main.py (FastAPI app)
import os, tempfile, json
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from yt_dlp import YoutubeDL
import whisper

app = FastAPI()

TRANSCRIBER_SHARED_SECRET = os.environ.get("TRANSCRIBER_SHARED_SECRET", "")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")

model = whisper.load_model(WHISPER_MODEL)

class UrlBody(BaseModel):
    url: str

def verify_secret(x_secret: str | None):
    if not TRANSCRIBER_SHARED_SECRET:
        return
    if not x_secret or x_secret != TRANSCRIBER_SHARED_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")

@app.post("/transcribe_url")
def transcribe_url(body: UrlBody, x_secret: str | None = Header(default=None)):
    verify_secret(x_secret)
    url = body.url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="invalid url")

    # Create temp audio path; let yt-dlp extract bestaudio. Since ffmpeg is present,
    # we can optionally force mp3 via postprocessor (commented).
    with tempfile.TemporaryDirectory() as td:
        outtmpl = os.path.join(td, "audio.%(ext)s")
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": outtmpl,
            "noprogress": True,
            "quiet": True,
            "no_warnings": True,
            # Uncomment this block if you want guaranteed mp3 output
            # "postprocessors": [{
            #     "key": "FFmpegExtractAudio",
            #     "preferredcodec": "mp3",
            #     "preferredquality": "192",
            # }],
        }
        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filepath = ydl.prepare_filename(info)
                # If postprocessor ran, extension may have changed; find the file in td
                if not os.path.exists(filepath):
                    # try common alternatives
                    base = os.path.splitext(filepath)[0]
                    for ext in (".m4a", ".webm", ".mp3", ".opus"):
                        if os.path.exists(base + ext):
                            filepath = base + ext
                            break

            # Transcribe with Whisper
            result = model.transcribe(filepath)
            return {
                "text": result.get("text", ""),
                "segments": result.get("segments", []),
            }
        except Exception as e:
            # Surface error server-side; return generic message to client
            print("yt-dlp/whisper failed:", repr(e))
            raise HTTPException(status_code=500, detail="transcribe_url failed")
