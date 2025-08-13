import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

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
              <Link
                to={`/sets/${s.id}`}
                className="block border rounded-lg p-3 bg-white shadow-sm hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm">View →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
