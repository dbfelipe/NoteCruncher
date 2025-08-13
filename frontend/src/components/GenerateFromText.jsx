import React, { useState, useEffect, use } from "react";
import axios from "axios";

function GenerateFromText() {
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [setName, setSetName] = useState("");
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");

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
        {
          text: inputText,
        }
      );
      setFlashcards(res.data.flashcards);
    } catch (error) {
      setError("Failed to generate flashcards.");
      console.error(error);
    }
    setLoading(false);
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
    } catch (error) {
      if (error.response?.status === 409) {
        setError(
          "A set with that name already exists. Use a different name (or we can add reuse flow next)."
        );
      } else {
        setError("Failed to save flashcards.");
      }
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateFlashcard = (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  return (
    <div>
      <h2>Generate Your Flashcard Set From Your Notes</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input
          type="text"
          placeholder="Set Name (required)"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          className="w-full sm:max-w-sm border rounded px-3 py-2"
        />

        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="w-full sm:max-w-xs border rounded px-3 py-2"
        >
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        rows={10}
        placeholder="Paste your transcript or lecture notes here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button onClick={handleGenerate} disabled={loading || !inputText}>
        {loading ? "Generating..." : "Generate Flashcards"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {flashcards.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Generated Flashcards</h3>
          {flashcards.map((card, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <input
                type="text"
                value={card.question}
                onChange={(e) =>
                  updateFlashcard(index, "question", e.target.value)
                }
                style={{ width: "100%", marginBottom: "0.5rem" }}
              />
              <textarea
                rows={3}
                value={card.answer}
                onChange={(e) =>
                  updateFlashcard(index, "answer", e.target.value)
                }
                style={{ width: "100%" }}
              />
            </div>
          ))}

          <button onClick={handleSaveAll} disabled={saving}>
            {saving ? "Saving..." : "Save All Flashcards"}
          </button>
        </div>
      )}
    </div>
  );
}

export default GenerateFromText;
