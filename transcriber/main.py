# main.py
import os, tempfile
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel
from yt_dlp import YoutubeDL

app = FastAPI()

SECRET = os.getenv("TRANSCRIBER_SHARED_SECRET", "")
MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny")  # tiny/base/small/etc.

def verify(x_secret: str | None):
    if SECRET and (x_secret != SECRET):
        raise HTTPException(status_code=401, detail="unauthorized")

# tiny/base with int8 fits in 512Mi easily
model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")

class UrlBody(BaseModel):
    url: str

@app.get("/health")
def health():
    return {"status": "OK"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), x_secret: str | None = Header(default=None)):
    verify(x_secret)
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    segments, info = model.transcribe(tmp_path)
    text = "".join(seg.text for seg in segments).strip()
    return {"text": text}

@app.post("/transcribe_url")
def transcribe_url(body: UrlBody, x_secret: str | None = Header(default=None)):
    verify(x_secret)
    url = body.url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="invalid url")

    with tempfile.TemporaryDirectory() as td:
        outtmpl = os.path.join(td, "audio.%(ext)s")
        ydl_opts = {"format": "bestaudio/best", "outtmpl": outtmpl, "noprogress": True, "quiet": True}
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            path = ydl.prepare_filename(info)
            # Pick the actual file (yt-dlp may choose m4a/webm/opus)
            base, _ = os.path.splitext(path)
            for ext in (".m4a", ".webm", ".opus", ".mp3"):
                cand = base + ext
                if os.path.exists(cand):
                    path = cand
                    break
        segments, info = model.transcribe(path)
        text = "".join(seg.text for seg in segments).strip()
        return {"text": text}