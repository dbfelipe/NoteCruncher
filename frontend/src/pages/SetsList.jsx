import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";

export default function SetsList() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/sets");
        setSets(res.data || []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load sets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDeleteSet = async (setId, e) => {
    e?.preventDefault(); // don't follow the Link
    e?.stopPropagation(); // don't bubble to the Link
    try {
      // ask backend for this set's cards
      const res = await axios.get(
        `http://localhost:3001/api/sets/${setId}/flashcards`
      );
      const hasCards = (res.data?.length ?? 0) > 0;

      if (
        !hasCards ||
        window.confirm(
          "This set has flashcards. Are you sure you want to delete it?"
        )
      ) {
        await axios.delete(`http://localhost:3001/api/sets/${setId}`);
        setSets((prev) => prev.filter((s) => s.id !== setId)); // update UI without a full reload
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete set.");
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Your Flashcard Sets</h2>

      {sets.length === 0 ? (
        <p className="text-gray-600">
          No sets yet. Create one from Generate or Manual.
        </p>
      ) : (
        <ul className="space-y-2">
          {sets.map((s) => (
            <li key={s.id}>
              <div className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm hover:shadow transition">
                {/* Left side (name + created_at) */}
                <Link to={`/sets/${s.id}`} className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString()
                      : ""}
                  </div>
                </Link>

                {/* Right side (View + Delete) */}
                <div className="flex items-center gap-3 ml-4">
                  <Link
                    to={`/sets/${s.id}`}
                    className="text-blue-600 text-sm"
                  ></Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteSet(s.id, e);
                    }}
                    className="text-red-500 hover:text-red-700 transition"
                    aria-label="Delete set"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
