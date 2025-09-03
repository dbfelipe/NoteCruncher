import "./index.css";
import React, { useState, useEffect } from "react";
import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";
import GenerateFromText from "./components/GenerateFromText";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import SetsList from "./pages/SetsList";
import SetDetail from "./pages/SetDetail";
import FolderDetail from "./pages/FolderDetail";
import StudyMode from "./pages/StudyMode";
import "./styles/theme-paper.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(hasAuthCode);

  const hasAuthCode = new URLSearchParams(window.location.search).has("code");
  const hasError = new URLSearchParams(window.location.search).has("error");

  useEffect(() => {
    if (hasAuthCode) {
      setIsProcessingAuth(true);

      // Give some time for Amplify to process the OAuth callback
      const timer = setTimeout(() => {
        setIsProcessingAuth(false);
        // Clean up the URL by removing the auth params
        const url = new URL(window.location);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        window.history.replaceState({}, "", url.pathname);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasAuthCode]);

  // Show loading screen while processing OAuth
  if (hasAuthCode && isProcessingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center">
          <div className="text-lg font-medium text-[var(--text)]">
            Signing you in...
          </div>
          <div className="mt-2 text-sm text-[var(--muted)]">
            Please wait while we complete your login
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if OAuth failed
  if (hasError) {
    const error = new URLSearchParams(window.location.search).get("error");
    const errorDescription = new URLSearchParams(window.location.search).get(
      "error_description"
    );

    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium text-red-600 mb-2">
            Login Failed
          </div>
          <div className="text-sm text-[var(--muted)] mb-4">
            Error: {error}
            {errorDescription && (
              <div className="mt-1">{decodeURIComponent(errorDescription)}</div>
            )}
          </div>
          <button
            onClick={() => {
              window.history.replaceState({}, "", "/");
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
          <Routes>
            <Route path="/" element={<Navigate to="/transcript" replace />} />
            <Route path="/transcript" element={<GenerateFromText />} />
            <Route path="/links" element={<FileUploader />} />
            <Route path="/manual" element={<ManualFlashcardBuilder />} />
            <Route path="/sets" element={<SetsList />} />
            <Route path="/sets/:id" element={<SetDetail />} />
            <Route path="/folders/:id" element={<FolderDetail />} />
            <Route path="/sets/:id/study" element={<StudyMode />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
