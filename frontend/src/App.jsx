// src/App.jsx
import "./index.css";
import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";
import GenerateFromText from "./components/GenerateFromText";
import SetsList from "./pages/SetsList";
import SetDetail from "./pages/SetDetail";
import FolderDetail from "./pages/FolderDetail";
import StudyMode from "./pages/StudyMode";
import Callback from "./pages/Callback";

import AuthGate from "./AuthGate"; // NEW (from earlier step)
import Landing from "./Landing"; // NEW (from earlier step)
import GreetingBanner from "./components/GreetingBanner";

import "./styles/theme-paper.css";

// Protected app chrome (Navbar + Sidebar) that only renders when signed in.
function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <AuthGate>
      <div className="flex flex-col h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
            {/* Child routes render here */}
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public greeting / hero */}
      <Route path="/" element={<Landing />} />

      {/* OAuth landing page can remain public */}
      <Route path="/callback" element={<Callback />} />

      {/* Everything below requires sign-in */}
      <Route element={<ProtectedLayout />}>
        <Route path="/transcript" element={<GenerateFromText />} />
        <Route path="/links" element={<FileUploader />} />
        <Route path="/manual" element={<ManualFlashcardBuilder />} />
        <Route path="/sets" element={<SetsList />} />
        <Route path="/sets/:id" element={<SetDetail />} />
        <Route path="/folders/:id" element={<FolderDetail />} />
        <Route path="/sets/:id/study" element={<StudyMode />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
