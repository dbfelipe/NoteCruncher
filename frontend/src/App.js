import "./App.css";
import React, { useState } from "react";
import SummaryList from "./components/SummaryList";
import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileUpload = () => {
    setRefreshKey((prev) => +1);
  };

  return (
    <div>
      <FileUploader onFileUpload={handleFileUpload} />
      <SummaryList key={refreshKey} />
      <ManualFlashcardBuilder />
    </div>
  );
}

export default App;
