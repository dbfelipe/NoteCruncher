import "./App.css";
import React, { useState } from "react";
import SummaryList from "./components/SummaryList";
import FileUploader from "./components/FileUploader";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileUpload = () => {
    setRefreshKey((prev) => +1);
  };

  return (
    <div>
      <FileUploader onFileUpload={handleFileUpload} />
      <SummaryList key={refreshKey} />
    </div>
  );
}

export default App;
