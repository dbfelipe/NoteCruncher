import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FiPlus, FiSave, FiFolder, FiFileText } from "react-icons/fi";

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

export default function GenerateFromText() {
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [setName, setSetName] = useState("");
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");

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

  const inputChars = inputText.length;
  const canGenerate = Boolean(setName.trim() && inputText.trim());
  const canSave = flashcards.length > 0 && setName.trim();

  const handleGenerate = async () => {
    if (!setName.trim()) {
      setError("Please enter a set name before generating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:3001/api/flashcards/generate",
        { text: inputText }
      );
      setFlashcards(res.data.flashcards || []);
      if ((res.data.flashcards || []).length === 0) {
        setError("No cards were generated. Try adding more context.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }
    if (flashcards.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const createSetRes = await axios.post("http://localhost:3001/api/sets", {
        name: setName.trim(),
        folder_id: selectedFolderId || null,
      });
      const setId = createSetRes.data.id;
      await Promise.all(
        flashcards.map((card) =>
          axios.post("http://localhost:3001/api/flashcards", {
            question: card.question,
            answer: card.answer,
            set_id: setId,
          })
        )
      );
      alert("Flashcards saved!");
    } catch (e) {
      if (e.response?.status === 409) {
        setError("A set with that name already exists. Use a different name.");
      } else {
        setError("Failed to save flashcards.");
      }
      console.error(e);
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
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
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
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: "var(--accent-strong)" }}
            >
              <FiPlus />
              {loading ? <DotsLoader label="Generating" active /> : "Generate"}
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

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="rounded-xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex justify-between mb-2">
            <h3 className="text-base font-semibold">Your Notes</h3>
            <div
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "var(--surface-2)",
                border: `1px solid var(--border)`,
                color: "var(--muted)",
              }}
            >
              {inputChars.toLocaleString()} chars
            </div>
          </div>
          <textarea
            rows={12}
            placeholder="Paste your transcript or lecture notes here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full rounded-lg px-3 py-2 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          {error && (
            <p className="mt-2 text-sm" style={{ color: "#b42318" }}>
              {error}
            </p>
          )}
        </section>

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
            {loading && (
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

          {flashcards.length === 0 && !loading && (
            <div
              className="rounded-xl border p-6 text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--muted)",
              }}
            >
              Generated cards will appear here. Give your set a name, paste
              notes, then click{" "}
              <span
                className="mx-1 px-2 py-0.5 rounded-md text-white"
                style={{ background: "var(--accent-strong)" }}
              >
                Generate
              </span>
              .
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
}
