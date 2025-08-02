import "./index.css";
import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";
import GenerateFromText from "./components/GenerateFromText";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileUpload = () => {
    setRefreshKey((prev) => +1);
  };

  return (
    <div>
      <h1 className="text-5xl text-blue-500 underline text-center">
        Hello world
      </h1>
      <GenerateFromText />
      <FileUploader />
      <ManualFlashcardBuilder />
    </div>
  );
}

export default App;
