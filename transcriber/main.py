from fastapi import FastAPI, File, UploadFile
import whisper
import tempfile
import shutil

app = FastAPI()
model = whisper.load_model("base")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Read the audio file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    result = model.transcribe(temp_path)
    return {"transcript": result["text"]}