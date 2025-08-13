import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function SetDetail() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
              <div className="text-sm text-gray-500 mb-1">Card #{c.id}</div>
              <div className="font-medium mb-1">Q: {c.question}</div>
              <div className="text-gray-800">A: {c.answer}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
