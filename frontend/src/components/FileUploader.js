import React, { useState } from "react";
import axios from "axios";

const FileUploader = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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
      if (onUploadComplete) onUploadComplete(response.data);
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
    </div>
  );
};

export default FileUploader;
