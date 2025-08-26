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

  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(
          `http://localhost:3001/api/sets?folder_id=${folderId}`
        );
        const unassigned = await axios.get(
          "http://localhost:3001/api/sets/unassigned"
        );
        setAvailableSets(unassigned.data);
        setSets(r.data || []);
      } catch (err) {
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
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold">Folder #{folderId}</h2>
        <Link
          to="/sets"
          className="text-sm px-3 py-1 rounded-md"
          style={{ background: "var(--cream)", color: "var(--ink)" }}
        >
          ← All sets
        </Link>
      </div>

      <main className="max-w-4xl mx-auto space-y-5">
        {/* Create new set in this folder */}
        <form
          onSubmit={handleCreateInFolder}
          className="rounded-xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-sm font-medium mb-2">Create new set</div>
          <input
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            placeholder="Set name"
            className="w-full rounded-lg px-3 py-2 border text-sm mb-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={creating || !newSetName.trim()}
            className="px-3 py-2 rounded-lg text-white disabled:opacity-60"
            style={{ background: "var(--accent-strong)" }}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        {/* Add existing set */}
        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-sm font-medium mb-2">Add existing set</div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedSetId) return;
              try {
                setAssigning(true);
                setAssignError("");
                const { data: updatedSet } = await axios.put(
                  `http://localhost:3001/api/sets/${selectedSetId}/folder`,
                  { folder_id: folderId }
                );
                setSets((prev) => [updatedSet, ...prev]);
                setAvailableSets((prev) =>
                  prev.filter((s) => s.id !== Number(selectedSetId))
                );
                setSelectedSetId("");
              } catch (err) {
                console.error(err);
                setAssignError("Failed to assign set.");
              } finally {
                setAssigning(false);
              }
            }}
            className="flex gap-2 items-center"
          >
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              <option value="">Select a set</option>
              {availableSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedSetId || assigning}
              className="px-3 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: "var(--accent-strong)" }}
            >
              {assigning ? "Adding…" : "Add"}
            </button>
          </form>
          {assignError && (
            <p className="text-xs mt-1" style={{ color: "#b42318" }}>
              {assignError}
            </p>
          )}
        </div>

        {/* Sets list */}
        {sets.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No sets in this folder yet.</p>
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
                    className="text-sm"
                    style={{ color: "var(--muted)" }}
                    title="Remove from folder"
                  ></button>
                }
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
