import os, tempfile
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel
from yt_dlp import YoutubeDL

# top of file
import os, tempfile, subprocess
from typing import List

COOKIES_PATH = "/tmp/youtube_cookies.txt"

def cookies_args() -> List[str]:
    """
    If YOUTUBE_COOKIES_TXT is present (Netscape format), write it to /tmp and
    return yt-dlp --cookies args. Falls back to YOUTUBE_COOKIE header string if set.
    """
    txt = os.environ.get("YOUTUBE_COOKIES_TXT")
    if txt:
        # Write only if not already the same (reduce container fs churn)
        try:
            # ensure directory exists (it does on Render, but be safe)
            os.makedirs(os.path.dirname(COOKIES_PATH), exist_ok=True)
            # write file
            with open(COOKIES_PATH, "w") as f:
                f.write(txt)
            return ["--cookies", COOKIES_PATH]
        except Exception as e:
            print("[cookies] failed to write cookies.txt:", repr(e))
            # If writing fails, we intentionally do not fall back silently.
            # It’s better to fail loudly so you notice.
            return []
    # Optional: fallback if you set YOUTUBE_COOKIE as a single header string.
    hdr = os.environ.get("YOUTUBE_COOKIE")
    if hdr:
        return ["--add-header", f"Cookie: {hdr}"]
    return []






app = FastAPI()

SECRET = os.getenv("TRANSCRIBER_SHARED_SECRET", "")
MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny")  # tiny/base/small …
YOUTUBE_COOKIE = os.getenv("YOUTUBE_COOKIE", "").strip()
YOUTUBE_COOKIES_TXT = os.getenv("YOUTUBE_COOKIES_TXT", "").strip()

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36")

# tiny/base with int8 fits under 512 MiB
model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")

def verify(x_secret: str | None):
    if SECRET and x_secret != SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")

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
    segments, _info = model.transcribe(tmp_path)
    text = "".join(seg.text for seg in segments).strip()
    return {"text": text}

@app.post("/transcribe_url")
def transcribe_url(body: UrlBody, x_secret: str | None = Header(default=None)):
    verify(x_secret)
    url = body.url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="invalid url")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(tempfile.gettempdir(), "audio.%(ext)s"),
        "noplaylist": True,
        "noprogress": True,
        "quiet": True,
        "no_warnings": True,
        "http_headers": {"User-Agent": UA},
    }

    cookiefile_path = None
    try:
        if YOUTUBE_COOKIES_TXT:
            cookiefile_path = os.path.join(tempfile.gettempdir(), "cookies.txt")
            with open(cookiefile_path, "w") as f:
                f.write(YOUTUBE_COOKIES_TXT)
            ydl_opts["cookiefile"] = cookiefile_path
        elif YOUTUBE_COOKIE:
            ydl_opts.setdefault("http_headers", {})["Cookie"] = YOUTUBE_COOKIE
        print("yt-dlp using cookiefile:", ydl_opts.get("cookiefile"))

        with tempfile.TemporaryDirectory() as td:
            ydl_opts["outtmpl"] = os.path.join(td, "audio.%(ext)s")
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                path = ydl.prepare_filename(info)
            # resolve actual file ext
            base, _ = os.path.splitext(path)
            for ext in (".m4a", ".webm", ".opus", ".mp3"):
                cand = base + ext
                if os.path.exists(cand):
                    path = cand
                    break

            segments, _info = model.transcribe(path)
            text = "".join(seg.text for seg in segments).strip()
            return {"text": text}
    except Exception as e:
        msg = repr(e)
        print("yt-dlp/whisper failed:", msg)
        raise HTTPException(
            status_code=500,
            detail={"stage": "yt-dlp/whisper", "error": msg}
        )

