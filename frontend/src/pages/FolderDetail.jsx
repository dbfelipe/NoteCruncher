import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import SetRow from "../components/SetRow";

export default function FolderDetail() {
  const { id: folderId } = useParams();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [newSetName, setNewSetName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(
          `http://localhost:3001/api/sets?folder_id=${folderId}`
        );
        setSets(r.data || []);
      } catch (e) {
        setErr("Failed to load sets for this folder.");
      } finally {
        setLoading(false);
      }
    })();
  }, [folderId]);

  const handleDeleteSet = async (setId) => {
    try {
      const res = await axios.get(
        `http://localhost:3001/api/sets/${setId}/flashcards`
      );
      const hasCards = (res.data?.length ?? 0) > 0;
      if (hasCards && !window.confirm("This set has flashcards. Delete it?"))
        return;

      await axios.delete(`http://localhost:3001/api/sets/${setId}`);
      setSets((prev) => prev.filter((s) => s.id !== setId));
    } catch {
      alert("Failed to delete set.");
    }
  };

  const handleRemoveFromFolder = async (setId) => {
    try {
      await axios.patch(`http://localhost:3001/api/sets/${setId}`, {
        folder_id: null,
      });
      setSets((prev) => prev.filter((s) => s.id !== setId));
    } catch {
      alert("Failed to remove set from folder.");
    }
  };

  const handleCreateInFolder = async (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    try {
      setCreating(true);
      const { data } = await axios.post("http://localhost:3001/api/sets", {
        name: newSetName.trim(),
        folder_id: folderId,
      });
      setSets((prev) => [data, ...prev]);
      setNewSetName("");
    } catch {
      alert("Failed to create set.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Folder #{folderId}</h2>
        <Link to="/sets" className="text-blue-600 text-sm hover:underline">
          ← All sets
        </Link>
      </div>

      {/* Add to folder controls */}
      <div className="mb-5 grid gap-3 md:grid-cols-2">
        {/* Create new set in this folder */}
        <form
          onSubmit={handleCreateInFolder}
          className="border rounded-lg p-3 bg-white shadow-sm"
        >
          <div className="text-sm font-medium mb-2">
            Create new set in this folder
          </div>
          <input
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            placeholder="Set name"
            className="border rounded w-full px-3 py-2 mb-2"
          />
          <button
            type="submit"
            disabled={creating || !newSetName.trim()}
            className="bg-blue-600 text-white text-sm px-3 py-2 rounded disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        {/* (Optional) Add existing set picker — you can build later */}
        <div className="border rounded-lg p-3 bg-white shadow-sm">
          <div className="text-sm font-medium mb-2">Add existing set</div>
          <button className="text-blue-600 text-sm">Choose a set…</button>
        </div>
      </div>

      {/* Sets list */}
      {sets.length === 0 ? (
        <p className="text-gray-600">No sets in this folder yet.</p>
      ) : (
        <ul className="space-y-2">
          {sets.map((s) => (
            <SetRow
              key={s.id}
              set={s}
              onDelete={handleDeleteSet}
              rightExtras={
                <button
                  onClick={() => handleRemoveFromFolder(s.id)}
                  className="text-gray-600 text-sm hover:underline"
                  title="Remove from folder"
                >
                  Remove
                </button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
