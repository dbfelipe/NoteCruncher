import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { React, useState, useEffect } from "react";
import ConfirmModal from "./ConfrimModal";
import axios from "axios";

export default function Sidebar({ isOpen, onClose }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [showAddInput, setShowAddInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/folders");
        setFolders(res.data);
        console.log("Fetched folders:", res.data);
      } catch (error) {
        console.error("Error fetching Folders:", error);
      }
    };
    fetchFolders();
  }, []);

  const handleAddFolder = async (e) => {
    //Stops the default form submit behavior so the page doesn’t reload when you press Enter or click “Add Folder.” The ?. just makes sure e exists before calling preventDefault()
    e?.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      setAddError("Folder name is required.");
      return;
    }
    setAddingFolder(true);
    setAddError("");
    try {
      const res = await axios.post("http://localhost:3001/api/folders", {
        name,
      });
      // optimistic prepend (API returns the created folder row)
      setFolders((prev) => [res.data, ...prev]);
      setNewFolderName("");
      setShowAddInput(false); // hide input after adding
    } catch (err) {
      if (err.response?.status === 409) {
        setAddError("That folder already exists.");
      } else {
        setAddError("Failed to add folder. Try again.");
      }
      console.error("Add folder error:", err);
    } finally {
      setAddingFolder(false);
    }
  };

  const handleDelete = async (folderId) => {
    const res = await axios.get(
      `http://localhost:3001/api/folders/${folderId}/flashcards`
    );
    const flashcards = res.data;

    setSelectedFolder({
      id: folderId,
      message:
        res.data.length > 0
          ? "This folder contains flashcards. Are you sure you want to delete it?"
          : "Are you sure you want to delete this folder?",
    });
    setModalOpen(true);
    setPendingDeleteId(folderId);
  };

  const handleConfirmDelete = async () => {
    await axios.delete(`http://localhost:3001/api/folders/${pendingDeleteId}`);
    setFolders(folders.filter((f) => f.id !== pendingDeleteId));
    setModalOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Saved Flashcards</h2>

        <ul className="space-y-2">
          {folders.map((folder) => (
            <li
              key={folder.id}
              className="group flex justify-between items-center text-gray-700 hover:text-blue-600"
            >
              <span className="cursor-pointer">{folder.name}</span>
              <button
                onClick={() => handleDelete(folder.id)}
                className="hidden group-hover:inline-flex text-red-500 hover:text-red-700 text-sm transition-opacity duration-150"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* Add Folder Section */}
        <div className="mb-4">
          {!showAddInput ? (
            <button
              onClick={() => setShowAddInput(true)}
              className="w-full bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Folder
            </button>
          ) : (
            <form onSubmit={handleAddFolder} className="space-y-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {addError && <p className="text-red-600 text-xs">{addError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingFolder}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
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
                  className="flex-1 bg-gray-300 text-gray-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-400"
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
          <div className="w-64 bg-white p-4 shadow-lg z-50">
            <button onClick={onClose} className="mb-4">
              <X className="h-6 w-6 text-gray-600 hover:text-red-500" />
            </button>
            <hr className="my-4 border-gray-200" />

            <h2 className="text-lg font-semibold mb-2">Navigation</h2>
            <ul className="space-y-2 mb-4">
              <li>
                <NavLink
                  to="/transcript"
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700 hover:text-blue-600"
                  }
                >
                  From Transcript
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/links"
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700 hover:text-blue-600"
                  }
                >
                  From Links / Files
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/manual"
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700 hover:text-blue-600"
                  }
                >
                  Manual
                </NavLink>
              </li>
            </ul>

            <h2 className="text-lg font-semibold mb-4">Saved Flashcards</h2>

            <ul className="space-y-2">
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className="group flex justify-between items-center text-gray-700 hover:text-blue-600"
                >
                  <span className="cursor-pointer">{folder.name}</span>
                  <button
                    onClick={() => handleDelete(folder.id)}
                    className="hidden group-hover:inline-flex text-red-500 hover:text-red-700 text-sm transition-opacity duration-150"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            {/* Add Folder Section (Mobile) */}

            <div className="mb-4">
              {!showAddInput ? (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="w-full bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Add Folder
                </button>
              ) : (
                <form onSubmit={handleAddFolder} className="space-y-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {addError && (
                    <p className="text-red-600 text-xs">{addError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingFolder}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
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
                      className="flex-1 bg-gray-300 text-gray-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Overlay background */}
          <div className="flex-1 bg-black opacity-30" onClick={onClose}></div>
        </div>
      )}
    </>
  );
}
