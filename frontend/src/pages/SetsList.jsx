import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import SetRow from "../components/SetRow";

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
    e?.preventDefault();
    e?.stopPropagation();
    try {
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
        setSets((prev) => prev.filter((s) => s.id !== setId));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete set.");
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Your Flashcard Sets</h2>

        {sets.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No sets yet. Create one from Generate or Manual.
          </p>
        ) : (
          <ul className="space-y-2">
            {sets.map((s) => (
              <SetRow
                key={s.id}
                set={s}
                onDelete={(id, e) => handleDeleteSet(id, e)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
