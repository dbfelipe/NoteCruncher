import React, { useState, useEffect } from "react";
import axios from "axios";

function GenerateFromText() {
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
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
    setSaving(true);
    try {
      await Promise.all(
        flashcards.map((card) =>
          axios.post("http://localhost:3001/api/flashcards", card)
        )
      );
      alert("Flashcards saved!");
    } catch (err) {
      setError("Failed to save flashcards.");
      console.error(error);
    }
    setSaving(false);
  };

  const updateFlashcard = (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  return (
    <div>
      <h2>Generate Flashcards from Transcript or Notes</h2>

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
