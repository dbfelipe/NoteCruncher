import "./index.css";
import React, { useState, useEffect } from "react";
import FileUploader from "./components/FileUploader";
import ManualFlashcardBuilder from "./components/ManualFlashcardBuilder";
import GenerateFromText from "./components/GenerateFromText";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import SetsList from "./pages/SetsList";
import SetDetail from "./pages/SetDetail";
import FolderDetail from "./pages/FolderDetail";
import StudyMode from "./pages/StudyMode";
import Callback from "./pages/Callback";
import "./styles/theme-paper.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  console.log("[App] current location =", location.pathname, location.search);

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
            {/* OAuth landing page */}
            <Route path="/callback" element={<Callback />} />
            <Route path="*" element={<Navigate to="/transcript" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
