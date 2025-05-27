import React, { useState } from "react";
import axios from "axios";

const FileUploader = ({ onFileUpload }) => {
  // Fixed spelling of prop name
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Fixed: using brackets instead of parentheses
  };

  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Make the POST request to upload the file
        const response = await axios.post(
          // Fixed variable spelling
          "http://localhost:5000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data", // Fixed spelling
            },
          }
        );

        // Pass the summary from the response to the parent component
        onFileUpload(response.data.summary); // Fixed prop name spelling
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.error("Please select a file first!");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

export default FileUploader;
