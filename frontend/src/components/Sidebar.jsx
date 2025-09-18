import { NavLink, Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import ConfirmModal from "./ConfrimModal";
import { TbCards } from "react-icons/tb";
import { FiFolder, FiPlus, FiHome } from "react-icons/fi";
import { api } from "../api";

export default function Sidebar({ isOpen, onClose }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [showAddInput, setShowAddInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [addError, setAddError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/folders");
        setFolders(res || []);
      } catch (error) {
        console.error("Error fetching Folders:", error);
      }
    })();
  }, []);

  const handleAddFolder = async (e) => {
    e?.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      setAddError("Folder name is required.");
      return;
    }
    setAddingFolder(true);
    setAddError("");
    try {
      const created = await api.post("/folders", { name });
      setFolders((prev) => [created, ...prev]);
      setNewFolderName("");
      setShowAddInput(false);
    } catch (err) {
      setAddError(
        err.response?.status === 409
          ? "That folder already exists."
          : "Failed to add folder. Try again."
      );
      console.error("Add folder error:", err);
    } finally {
      setAddingFolder(false);
    }
  };

  const handleDelete = async (folderId) => {
    try {
      await api.get(`/folders/${folderId}/sets`);
    } catch {}
    setSelectedFolder({
      id: folderId,
      message:
        "Are you sure you want to delete this folder? Although it will be deleted permenantly your sets will still be accessible.",
    });
    setModalOpen(true);
    setPendingDeleteId(folderId);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.put(`/sets/unassign-by-folder/${pendingDeleteId}`);
      await api.del(`/folders/${pendingDeleteId}`); // NOTE: helper uses .del
      setFolders((prev) => prev.filter((f) => f.id !== pendingDeleteId));
      setModalOpen(false);
      setPendingDeleteId(null);
      navigate("/sets", { replace: true });
    } catch (err) {
      console.error("Failed to delete folder:", err);
      alert("Failed to delete folder.");
    }
  };

  const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition
         hover:bg-[color:var(--accent-hover)]
         ${
           isActive
             ? "bg-[color:var(--cream)] text-[color:var(--ink)]"
             : "text-[color:var(--text)]"
         }`
      }
    >
      <Icon className="text-xl" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  const FolderItem = ({ id, name, onClick }) => (
    <NavLink
      to={`/folders/${id}`}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition
         hover:bg-[color:var(--accent-hover)]
         ${
           isActive
             ? "bg-[color:var(--cream)] text-[color:var(--ink)]"
             : "text-[color:var(--text)]"
         }`
      }
    >
      <div className="flex items-center gap-3">
        <FiFolder className="text-lg" style={{ color: "var(--muted)" }} />
        <span className="truncate">{name}</span>
      </div>
    </NavLink>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="w-64 px-4 py-6 hidden md:block border-r"
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          borderColor: "var(--border)",
        }}
      >
        {/* Main navigation */}
        <SidebarItem to="/" icon={FiHome} label="Home" />
        <SidebarItem to="/sets" icon={TbCards} label="Flashcards" />

        <hr className="my-4" style={{ borderColor: "var(--border)" }} />

        {/* Folders */}
        <h4
          className="px-3 mb-2 text-xs uppercase tracking-wide"
          style={{ color: "var(--muted)" }}
        >
          Folders
        </h4>
        <ul className="space-y-1">
          {folders.map((f) => (
            <li key={f.id}>
              <div className="group">
                <FolderItem id={f.id} name={f.name} />
              </div>
            </li>
          ))}
        </ul>

        {/* Add Folder Section */}
        <div className="mt-3">
          {!showAddInput ? (
            <button
              onClick={() => setShowAddInput(true)}
              className="mx-3 mt-3 inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border hover:opacity-90"
              style={{
                background: "var(--cream)",
                borderColor: "var(--cream-2)",
                color: "var(--ink)",
              }}
            >
              <FiPlus className="text-base" />
              New folder
            </button>
          ) : (
            <form onSubmit={handleAddFolder} className="space-y-2 mt-3 px-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-3 py-2 text-sm rounded-lg
                           bg-[color:var(--surface)] border border-[color:var(--border)]
                           text-[color:var(--text)] placeholder-[color:var(--muted)]
                           focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                autoFocus
              />
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingFolder}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60
                             focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ background: "var(--accent-strong)" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--accent-hover)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--accent-strong)")
                  }
                >
                  {addingFolder ? "Adding..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInput(false);
                    setAddError("");
                    setNewFolderName("");
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border hover:bg-[color:var(--surface-2)]"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>

      <ConfirmModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message={selectedFolder?.message}
      />

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="w-64 p-4 shadow-lg z-50"
            style={{ background: "var(--surface)", color: "var(--text)" }}
          >
            <button onClick={onClose} className="mb-4">
              <X className="h-6 w-6" style={{ color: "var(--muted)" }} />
            </button>

            <hr className="my-4" style={{ borderColor: "var(--border)" }} />

            <SidebarItem to="/" icon={FiHome} label="Home" />
            <SidebarItem to="/sets" icon={TbCards} label="Flashcards" />

            <hr className="my-4" style={{ borderColor: "var(--border)" }} />

            <h4
              className="px-1 mb-2 text-xs uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              Folders
            </h4>
            <ul className="space-y-1">
              {folders.map((f) => (
                <li key={f.id}>
                  <div className="group">
                    <FolderItem id={f.id} name={f.name} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Add Folder Section (Mobile) */}
            <div className="mt-3">
              {!showAddInput ? (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border hover:opacity-90"
                  style={{
                    background: "var(--cream)",
                    borderColor: "var(--cream-2)",
                    color: "var(--ink)",
                  }}
                >
                  <FiPlus className="text-base" />
                  New folder
                </button>
              ) : (
                <form onSubmit={handleAddFolder} className="space-y-2 mt-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full px-3 py-2 text-sm rounded-lg
                               bg-[color:var(--surface)] border border-[color:var(--border)]
                               text-[color:var(--text)] placeholder-[color:var(--muted)]
                               focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                    autoFocus
                  />
                  {addError && (
                    <p className="text-red-400 text-xs">{addError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingFolder}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60
                                 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                      style={{ background: "var(--accent-strong)" }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background =
                          "var(--accent-hover)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          "var(--accent-strong)")
                      }
                    >
                      {addingFolder ? "Adding..." : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddInput(false);
                        setAddError("");
                        setNewFolderName("");
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border hover:bg-[color:var(--surface-2)]"
                      style={{
                        background: "var(--surface)",
                        color: "var(--text)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Overlay background */}
          <div className="flex-1 bg-black opacity-30" onClick={onClose} />
        </div>
      )}
    </>
  );
}
