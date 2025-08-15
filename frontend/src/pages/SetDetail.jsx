import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function SetDetail() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // (optional) fetch set meta if your API supports it; if not, skip this call
        // const s = await axios.get(`http://localhost:3001/api/sets/${id}`);
        // setSetInfo(s.data);

        const res = await axios.get(
          `http://localhost:3001/api/sets/${id}/flashcards`
        );
        setCards(res.data || []);
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

  const handleAddCard = async () => {
    if (!newQ.trim() || !newA.trim()) {
      alert("Please fill in both question and answer.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/api/flashcards", {
        question: newQ.trim(),
        answer: newA.trim(),
        set_id: id,
      });

      setCards((prev) => [...prev, res.data]);

      // Clear form
      setNewQ("");
      setNewA("");
    } catch (err) {
      console.error(err);
      alert("Failed to add flashcard.");
    }
  };
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          {setInfo?.name ? setInfo.name : `Set #${id}`}
        </h2>
        <Link to="/sets" className="text-blue-600 text-sm hover:underline">
          ← Back to sets
        </Link>
      </div>

      {cards.length === 0 ? (
        <p className="text-gray-600">No flashcards in this set.</p>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="border rounded-lg p-3 bg-white shadow-sm"
            >
              <div className="font-medium mb-1">Q: {c.question}</div>
              <div className="text-gray-800">A: {c.answer}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Add Flashcard</h3>
        <input
          type="text"
          placeholder="Question"
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <textarea
          placeholder="Answer"
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          rows={3}
          className="border p-2 w-full mb-2"
        />
        <button
          onClick={handleAddCard}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Flashcard
        </button>
      </div>
    </div>
  );
}
