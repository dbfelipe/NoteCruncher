import React, { useState, useEffect } from "react";
import axios from "axios";

function ManualFlashcardBuilder() {
  const [flashcards, setFlashcards] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [setName, setSetName] = useState("");
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  const [cards, setCards] = useState([{ question: "", answer: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/folders");
        setFolders(res.data || []);
      } catch (e) {
        console.error("Folder fetch failed:", e);
      }
    })();
  }, []);

  const updateCard = (index, field, value) => {
    const next = [...cards];
    next[index][field] = value;
    setCards(next);
  };

  const addCard = () =>
    setCards((prev) => [...prev, { question: "", answer: "" }]);
  const removeCard = (index) =>
    setCards((prev) => prev.filter((_, i) => i !== index));

  const handleCreateSet = async () => {
    setError("");
    setSuccess("");
    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }
    const cleaned = cards
      .map((c) => ({
        question: (c.question || "").trim(),
        answer: (c.answer || "").trim(),
      }))
      .filter((c) => c.question && c.answer);
    if (cleaned.length === 0) {
      setError(
        "Add at least one flashcard with both a question and an answer."
      );
      return;
    }
    setSaving(true);
    try {
      const setRes = await axios.post("http://localhost:3001/api/sets", {
        name: setName.trim(),
        folder_id: folderId || null,
      });
      const setId = setRes.data.id;
      await Promise.all(
        cleaned.map((c) =>
          axios.post("http://localhost:3001/api/flashcards", {
            question: c.question,
            answer: c.answer,
            set_id: setId,
          })
        )
      );
      setSuccess("Set created and flashcards saved!");
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.status === 409
          ? "A set with that name already exists. Use a different name."
          : "Failed to create set or save flashcards."
      );
    } finally {
      setSaving(false);
    }
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
        <div className="w-full py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Set title (required)"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
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
              onClick={handleCreateSet}
              disabled={saving || !setName.trim()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: "var(--accent-strong)" }}
            >
              {saving ? "Creating..." : "Create Set"}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full space-y-4">
        {" "}
        {cards.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--muted)" }}
              >
                Card {i + 1}
              </span>
              {cards.length > 1 && (
                <button
                  onClick={() => removeCard(i)}
                  className="text-sm"
                  style={{ color: "#b42318" }}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="w-full rounded-lg px-3 py-2 border text-sm"
                placeholder="Enter question"
                value={c.question}
                onChange={(e) => updateCard(i, "question", e.target.value)}
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <textarea
                className="w-full rounded-lg px-3 py-2 border text-sm"
                rows={2}
                placeholder="Enter answer"
                value={c.answer}
                onChange={(e) => updateCard(i, "answer", e.target.value)}
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
          </div>
        ))}
        <div>
          <button
            onClick={addCard}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            + Add a card
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-sm" style={{ color: "#15803d" }}>
            {success}
          </p>
        )}
      </main>
    </div>
  );
}

export default ManualFlashcardBuilder;
