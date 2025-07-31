import "./index.css";
import React, { useState } from "react";
import SummaryList from "./components/SummaryList";
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
      <h1 className="text-7xl text-center text-blue-400">Hello world</h1>
      <GenerateFromText />
      <FileUploader />
      <ManualFlashcardBuilder />
    </div>
  );
}

export default App;
