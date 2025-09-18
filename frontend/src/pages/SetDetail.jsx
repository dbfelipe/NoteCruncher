import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { api } from "../api";

export default function SetDetail() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/sets/${id}/flashcards`);
        setCards(data || []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load flashcards for this set.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  const beginEdit = (card) => {
    setEditingId(card.id);
    setDraftQ(card.question);
    setDraftA(card.answer);
    setEditErr("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftQ("");
    setDraftA("");
    setEditErr("");
  };

  const saveEdit = async () => {
    if (!draftQ.trim() || !draftA.trim()) {
      setEditErr("Both fields are required.");
      return;
    }
    setSavingEdit(true);
    setEditErr("");

    try {
      const updated = await api.put(`/flashcards/${editingId}`, {
        question: draftQ.trim(),
        answer: draftA.trim(),
      });
      setCards((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c))
      );
      cancelEdit();
    } catch (err) {
      console.error(err);
      setEditErr("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddCard = async () => {
    if (!newQ.trim() || !newA.trim()) {
      alert("Please fill in both question and answer.");
      return;
    }
    try {
      const res = await api.post("/flashcards", {
        question: newQ.trim(),
        answer: newA.trim(),
        set_id: id,
      });
      setCards((prev) => [...prev, res]);
      setNewQ("");
      setNewA("");
    } catch (err) {
      console.error(err);
      alert("Failed to add flashcard.");
    }
  };

  const deleteCard = async (cardId) => {
    try {
      await api.del(`/flashcards/${cardId}`);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete flashcard.");
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold">
          {setInfo?.name ? setInfo.name : `Set #${id}`}
        </h2>
        <div className="flex gap-3">
          <Link
            to="/sets"
            className="text-sm px-3 py-1 rounded-md"
            style={{ background: "var(--cream)", color: "var(--ink)" }}
          >
            ← Back to sets
          </Link>
          <Link
            to={`/sets/${id}/study`}
            className="text-sm px-3 py-1 rounded-md"
            style={{ background: "var(--accent-strong)", color: "#fff" }}
          >
            Study mode →
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto space-y-4">
        {cards.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No flashcards in this set.</p>
        ) : (
          <div className="space-y-3">
            {cards.map((c) => {
              const isEditing = c.id === editingId;
              return (
                <div
                  key={c.id}
                  className="group relative rounded-xl border p-4"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {!isEditing && (
                    <button
                      onClick={() => deleteCard(c.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-10"
                      style={{ color: "#b42318" }}
                      aria-label="Delete flashcard"
                    >
                      ✕
                    </button>
                  )}
                  {!isEditing && (
                    <>
                      <div className="font-medium mb-1">Q: {c.question}</div>
                      <div style={{ color: "var(--muted)" }}>A: {c.answer}</div>
                      <button
                        onClick={() => beginEdit(c)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 transition z-10"
                        style={{ color: "var(--muted)" }}
                        aria-label="Edit flashcard"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <label
                        className="block text-xs mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        Question
                      </label>
                      <input
                        value={draftQ}
                        onChange={(e) => setDraftQ(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 border text-sm mb-2"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                        autoFocus
                      />
                      <label
                        className="block text-xs mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        Answer
                      </label>
                      <textarea
                        value={draftA}
                        onChange={(e) => setDraftA(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg px-3 py-2 border text-sm mb-2"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                      {editErr && (
                        <div
                          className="text-sm mb-2"
                          style={{ color: "#b42318" }}
                        >
                          {editErr}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm rounded-lg border"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                          disabled={savingEdit}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 text-sm rounded-lg text-white disabled:opacity-60"
                          style={{ background: "var(--accent-strong)" }}
                          disabled={savingEdit}
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-2">Add Flashcard</h3>
          <input
            type="text"
            placeholder="Question"
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="w-full rounded-lg px-3 py-2 border text-sm mb-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <textarea
            placeholder="Answer"
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            rows={3}
            className="w-full rounded-lg px-3 py-2 border text-sm mb-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={handleAddCard}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: "var(--accent-strong)" }}
          >
            Add Flashcard
          </button>
        </div>
      </main>
    </div>
  );
}
