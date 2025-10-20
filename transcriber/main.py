# main.py
import os
import shutil
import tempfile
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.responses import JSONResponse
import whisper

app = FastAPI()

# Load the model once (CPU). You can change to "small"/"medium" later.
MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
model = whisper.load_model(MODEL_NAME)

SHARED_SECRET = os.getenv("TRANSCRIBER_SHARED_SECRET", "")

@app.get("/health")
def health():
    return {"status": "OK", "model": MODEL_NAME}

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    x_secret: str | None = Header(default=None),
):
    if not SHARED_SECRET or x_secret != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Save incoming file to a temp path
    suffix = os.path.splitext(file.filename or "")[1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Whisper auto-runs ffmpeg under the hood (needs system ffmpeg)
        result = model.transcribe(tmp_path)
        return JSONResponse({"text": result.get("text", ""), "segments": result.get("segments", [])})
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
