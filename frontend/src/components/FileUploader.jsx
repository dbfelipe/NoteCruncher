import React, { useState } from "react";
import axios from "axios";

const FileUploader = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const formData = newFormData();

  if (youtubeUrl) {
    formData.append("youtubeUrl", youtubeUrl);
  } else if (file) {
    formData.append("file", file);
  } else {
    setStatus("Please select a file or enter a Youtube link.");
    return;
  }

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading and processing...");

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

      setStatus("Summary created!");

      //Notidy parent to refresh summaries if needed
      if (onFileUpload) onFileUpload(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("Upload failed");
    }
  };

  return (
    <div style={{ margin: "2rem auto", maxWidth: 800 }}>
      <h2>Upload Audio File</h2>
      <input type="file" accept=".mp3" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "1rem" }}>
        Upload
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
    </div>
  );
};

export default FileUploader;
