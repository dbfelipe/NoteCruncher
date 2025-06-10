import React, { useState } from "react";
import axios from "axios";

const FileUploader = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  // const [youtubeUrl, setYoutubeUrl] = useState("");
  // const formData = new FormData();

  // if (youtubeUrl) {
  //   formData.append("youtubeUrl", youtubeUrl);
  // } else if (file) {
  //   formData.append("file", file);
  // } else {
  //   setStatus("Please select a file or enter a Youtube link.");
  //   return;
  // }

  const handleUpload = async () => {
    const formData = new FormData();
    let endpoint = "";

    if (youtubeUrl) {
      formData.append("youtubeUrl", youtubeUrl);
    } else if (file) {
      formData.append("file", file);
    } else {
      setStatus("Please select a file or enter a Youtube link.");
      return;
    }
    if (!file) {
      setStatus("Please select a file.");
      return;
    }

    setStatus("Uploading and processing...");
    setUploading(true);
    setProgress(0);

    //fake progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 400);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/videos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setProgress(100);
      setTimeout(() => setUploading(false), 500);
      setStatus("Summary created!");

      //Notidy parent to refresh summaries if needed
      if (onFileUpload) onFileUpload(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("Upload failed");
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "2rem auto", maxWidth: 800 }}>
      <h2>Upload Audio File</h2>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "1rem" }}>
        Upload file
      </button>
      <p>{status}</p>
      <h3> Or paste Youtube Link </h3>
      <input
        type="text"
        placeholder="https://youtube.com/watch?v=..."
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      />
      <button onClick={handleUpload} style={{ marginLeft: "1rem" }}>
        Upload link
      </button>
      {uploading && (
        <div style={{ height: "10px", background: "#ddd", marginTop: "1rem" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#4caf50",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
