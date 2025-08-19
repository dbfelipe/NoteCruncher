import "./index.css";
import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";
import GenerateFromText from "./components/GenerateFromText";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import SetsList from "./pages/SetsList";
import SetDetail from "./pages/SetDetail";
import FolderDetail from "./pages/FolderDetail";

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/transcript" replace />} />
            <Route path="/transcript" element={<GenerateFromText />} />
            <Route path="/links" element={<FileUploader />} />
            <Route path="/manual" element={<ManualFlashcardBuilder />} />
            <Route path="/sets" element={<SetsList />} />
            <Route path="/sets/:id" element={<SetDetail />} />
            <Route path="/folders/:id" element={<FolderDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
