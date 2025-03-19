import React, { useState } from "react";
import axios from "axios";
const FileUploader = ({ onFileUplaod }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files(0)); // Get the selected file
  };

  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Make the POST request to upload the file
        const reponse = await axios.post(
          "http://localhost:5000/upload",
          formData,
          {
            headers: {
              "Content-Type": "mulipart/form-data",
            },
          }
        );

        // Pass the summary from the response to the parent component
        onFileUplaod(reponse.data.summary);
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
