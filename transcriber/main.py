import os, shutil, tempfile
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

app = FastAPI()

MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny")  # tiny/base/small/…
COMPUTE_TYPE = os.getenv("FW_COMPUTE_TYPE", "int8")  # int8 / int8_float16 / int16 / float32
MODEL_CACHE = os.getenv("MODEL_CACHE_DIR", "/app/models")

model = WhisperModel(MODEL_NAME, device="cpu", compute_type=COMPUTE_TYPE, download_root=MODEL_CACHE)
SHARED_SECRET = os.getenv("TRANSCRIBER_SHARED_SECRET", "")

@app.get("/health")
def health():
    return {"status":"OK","model":MODEL_NAME,"compute_type":COMPUTE_TYPE}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), x_secret: str | None = Header(default=None)):
    if not SHARED_SECRET or x_secret != SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    suffix = os.path.splitext(file.filename or "")[1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path)
        out_segments = []
        for seg in segments:
            out_segments.append({
                "id": seg.id,
                "start": seg.start,
                "end": seg.end,
                "text": seg.text
            })
        return JSONResponse({"text": " ".join([s["text"] for s in out_segments]).strip(),
                             "language": info.language,
                             "segments": out_segments})
    finally:
        try: os.remove(tmp_path)
        except OSError: pass
