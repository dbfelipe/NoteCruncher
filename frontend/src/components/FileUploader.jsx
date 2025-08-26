import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiUpload, FiLink, FiSave, FiFolder, FiFileText } from "react-icons/fi";

function DotsLoader({ label = "Working", active }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 300);
    return () => clearInterval(id);
  }, [active]);
  return (
    <span>
      {label}
      {active ? dots : ""}
    </span>
  );
}

const FileUploader = ({ onFileUpload }) => {
  // Naming & folder
  const [setName, setSetName] = useState("");
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  // Upload sources
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Status & results
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);

  // Persist
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/folders");
        setFolders(res.data || []);
      } catch (e) {
        console.error("Failed to fetch folders:", e);
      }
    })();
  }, []);

  const canGenerate = Boolean(setName.trim() && (youtubeUrl.trim() || file));
  const canSave = flashcards.length > 0 && setName.trim();

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUploadAndGenerate = async () => {
    setError("");
    if (!setName.trim()) {
      setError("Please enter a set name before uploading.");
      return;
    }
    if (!youtubeUrl && !file) {
      setError("Please select a file or enter a YouTube link.");
      return;
    }

    const formData = new FormData();
    let endpoint = "";

    if (youtubeUrl) {
      formData.append("url", youtubeUrl);
      endpoint = "http://localhost:3001/api/videos/youtube";
    } else if (file) {
      formData.append("file", file);
      endpoint = "http://localhost:3001/api/videos/upload";
    }

    setUploading(true);
    setStatus("Uploading & processing");

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { transcript } = response.data;

      const flashRes = await axios.post(
        "http://localhost:3001/api/flashcards/generate",
        { text: transcript }
      );
      setFlashcards(flashRes.data.flashcards || []);

      if (onFileUpload) onFileUpload(response.data);
      setStatus("Done");
    } catch (err) {
      console.error("Error uploading file or link:", err);
      setStatus("Upload failed");
      setError("Something went wrong during upload. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAll = async () => {
    setError("");
    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }
    if (!flashcards.length) return;

    setSaving(true);
    try {
      // 1) Create set
      const setRes = await axios.post("http://localhost:3001/api/sets", {
        name: setName.trim(),
        folder_id: folderId || null,
      });
      const setId = setRes.data.id;

      // 2) Save flashcards
      await Promise.all(
        flashcards.map((card) =>
          axios.post("http://localhost:3001/api/flashcards", {
            question: card.question,
            answer: card.answer,
            set_id: setId,
          })
        )
      );
      alert("Flashcards saved to your set!");
    } catch (e) {
      console.error(e);
      setError(
        e.response?.status === 409
          ? "A set with that name already exists. Use a different name."
          : "Failed to save flashcards."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateFlashcard = (index, field, value) => {
    setFlashcards((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="border-b mb-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <FiFileText className="opacity-70" />
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Set name (required)"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFolder className="opacity-70" />
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleUploadAndGenerate}
              disabled={!canGenerate || uploading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: "var(--accent-strong)" }}
            >
              <FiUpload />
              {uploading ? (
                <DotsLoader label="Processing" active />
              ) : (
                "Upload & Generate"
              )}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border disabled:opacity-60"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <FiSave />
              {saving ? <DotsLoader label="Saving" active /> : "Save All"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <section
          className="rounded-xl border p-4 space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="text-base font-semibold">Upload Source</h3>

          {/* File picker */}
          <div
            className="rounded-lg border p-4 flex items-center justify-between gap-3"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg grid place-items-center"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid var(--border)`,
                }}
              >
                <FiUpload className="opacity-80" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Audio file (.mp3)</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  We extract a transcript, then generate flashcards.
                </div>
              </div>
            </div>
            <label
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              Choose file
              <input
                type="file"
                accept=".mp3"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* YouTube URL */}
          <div
            className="rounded-lg border p-4 space-y-2"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            <div className="flex items-center gap-2">
              <FiLink className="opacity-80" />
              <span className="text-sm font-medium">
                Or paste a YouTube link
              </span>
            </div>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Status */}
          {(uploading || status || error) && (
            <div className="flex items-center gap-2 text-sm">
              {uploading && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid var(--border)`,
                    color: "var(--muted)",
                  }}
                >
                  <DotsLoader label="Working" active />
                </span>
              )}
              {status && !uploading && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid var(--border)`,
                    color: "var(--muted)",
                  }}
                >
                  {status}
                </span>
              )}
              {error && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: "#b42318",
                    border: `1px solid #b4231833`,
                    background: "#b4231811",
                  }}
                >
                  {error}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Right: Preview & results */}
        <section className="space-y-3">
          <div
            className="rounded-xl border px-4 py-3 flex justify-between items-center"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="text-base font-semibold">
              {flashcards.length
                ? `Generated Flashcards (${flashcards.length})`
                : "Preview"}
            </h3>
            {uploading && (
              <div
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid var(--border)`,
                  color: "var(--muted)",
                }}
              >
                <DotsLoader label="Thinking" active />
              </div>
            )}
          </div>

          {!flashcards.length && !uploading && (
            <div
              className="rounded-xl border p-6 text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--muted)",
              }}
            >
              Upload an audio file or paste a YouTube link, then click
              <span
                className="mx-1 px-2 py-0.5 rounded-md text-white"
                style={{ background: "var(--accent-strong)" }}
              >
                Upload & Generate
              </span>
              to see generated flashcards here.
            </div>
          )}

          {flashcards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border p-4 space-y-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <input
                type="text"
                value={card.question}
                onChange={(e) =>
                  updateFlashcard(index, "question", e.target.value)
                }
                placeholder={`Q${index + 1}: question`}
                className="w-full rounded-lg px-3 py-2 border text-sm"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <textarea
                rows={3}
                value={card.answer}
                onChange={(e) =>
                  updateFlashcard(index, "answer", e.target.value)
                }
                placeholder={`A${index + 1}: answer`}
                className="w-full rounded-lg px-3 py-2 border text-sm"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default FileUploader;
