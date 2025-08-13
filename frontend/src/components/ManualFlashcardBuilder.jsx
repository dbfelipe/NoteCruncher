import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FlashcardStyles.css";

function ManualFlashcardBuilder() {
  const [flashcards, setFlashcards] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [setName, setSetName] = useState("");
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  const [cards, setCards] = useState([
    { question: "", answer: "" }, // start with one empty row
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/folders");
        setFolders(res.data || []);
      } catch (e) {
        // non-fatal
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

    // Filter out blank rows; trim text
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
      // 1) Create the set
      const setRes = await axios.post("http://localhost:3001/api/sets", {
        name: setName.trim(),
        folder_id: folderId || null,
      });
      const setId = setRes.data.id;

      // 2) Save all cards with set_id
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
      // Optional reset
      // setSetName(""); setFolderId(""); setCards([{ question: "", answer: "" }]);
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

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/flashcards"
        );
        setFlashcards(response.data);
        console.log("Fetched flashcards:", response.data);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };
    fetchFlashcards();
  }, []);

  const handleAddFlashcard = async () => {
    if (!newQuestion || !newAnswer) return;
    try {
      const response = await axios.post(
        "http://localhost:3001/api/flashcards",
        {
          question: newQuestion,
          answer: newAnswer,
        }
      );
      setFlashcards([...flashcards, response.data]);
      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      console.error("Error adding flashcard:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log(id);
      await axios.delete(`http://localhost:3001/api/flashcards/${id}`);
      setFlashcards(flashcards.filter((card) => card.id !== id));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  const handleEdit = async (id, updatedCard) => {
    try {
      const response = await axios.put(
        `http://localhost:3001/api/flashcards/${id}`,
        updatedCard
      );
      setFlashcards(
        flashcards.map((card) => (card.id === id ? response.data : card))
      );
    } catch (error) {
      console.error("Error editing flashcard:", error);
    }
  };

  const toggleCard = (id) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, flipped: !card.flipped } : card
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Create a new flashcard set</h2>

      {/* Set name + folder */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="w-full sm:max-w-md border rounded px-3 py-2"
          placeholder='Set title (e.g., "Biology — Chapter 22")'
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
        />
        <select
          className="w-full sm:max-w-xs border rounded px-3 py-2"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Card editor list */}
      <div className="space-y-4">
        {cards.map((c, i) => (
          <div key={i} className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Card {i + 1}
              </span>
              {cards.length > 1 && (
                <button
                  onClick={() => removeCard(i)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Enter question"
                value={c.question}
                onChange={(e) => updateCard(i, "question", e.target.value)}
              />
              <textarea
                className="border rounded px-3 py-2"
                rows={2}
                placeholder="Enter answer"
                value={c.answer}
                onChange={(e) => updateCard(i, "answer", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add card */}
      <div className="mt-4">
        <button
          onClick={addCard}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          + Add a card
        </button>
      </div>

      {/* Errors / success */}
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      {success && <p className="mt-3 text-green-700 text-sm">{success}</p>}

      {/* Create set */}
      <div className="mt-6">
        <button
          onClick={handleCreateSet}
          disabled={saving || !setName.trim()}
          className="px-5 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create set"}
        </button>
      </div>
    </div>
  );
}

export default ManualFlashcardBuilder;
