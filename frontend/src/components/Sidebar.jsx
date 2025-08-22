import { NavLink, Link, useNavigate } from "react-router-dom";
import { Heading3, X } from "lucide-react";
import { React, useState, useEffect } from "react";
import ConfirmModal from "./ConfrimModal";
import axios from "axios";
import { TbCards } from "react-icons/tb"; // flashcards icon
import { FiFolder, FiPlus, FiHome } from "react-icons/fi"; // folder + add

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
      `http://localhost:3001/api/folders/${folderId}/sets`
    );
    const sets = res.data;

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
      // Step 1: Unassign sets from this folder
      await axios.put(
        `http://localhost:3001/api/sets/unassign-by-folder/${pendingDeleteId}`
      );

      // Step 2: Delete the folder
      await axios.delete(
        `http://localhost:3001/api/folders/${pendingDeleteId}`
      );

      // Step 3: Update local folder list
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
         hover:bg-gray-100 ${
           isActive ? "bg-gray-100 text-blue-600" : "text-gray-700"
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
        `flex items-center gap-3 px-3 py-2 rounded-lg transition
         hover:bg-gray-100 ${
           isActive ? "bg-gray-100 text-blue-600" : "text-gray-700"
         }`
      }
    >
      <FiFolder className="text-lg text-gray-500" />
      <span className="truncate">{name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6 hidden md:block">
        {/* Main navigation */}
        <SidebarItem to="/" icon={FiHome} label="Home" />
        <SidebarItem to="/sets" icon={TbCards} label="Flashcards" />

        <hr className="my-4 border-gray-200" />

        {/* Folders */}
        <h4 className="px-3 mb-2 text-xs uppercase tracking-wide text-gray-500">
          Folders
        </h4>
        <ul className="space-y-1">
          <ul className="space-y-1">
            {folders.map((f) => (
              <li key={f.id}>
                <div className="group flex items-center justify-between hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                  <FolderItem id={f.id} name={f.name} />
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                    title="Delete folder"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </ul>

        {/* Add Folder Section */}
        <div className="mt-3">
          {!showAddInput ? (
            <button
              onClick={() => setShowAddInput(true)}
              className="mx-3 mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
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

            {/* Main navigation */}
            <SidebarItem to="/" icon={FiHome} label="Home" />
            <SidebarItem to="/sets" icon={TbCards} label="Flashcards" />

            <hr className="my-4 border-gray-200" />

            {/* Folders */}
            <h4 className="px-1 mb-2 text-xs uppercase tracking-wide text-gray-500">
              Folders
            </h4>
            <ul className="space-y-1">
              {folders.map((f) => (
                <li key={f.id}>
                  <div className="group flex items-center justify-between hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                    <FolderItem id={f.id} name={f.name} />
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                      title="Delete folder"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add Folder Section (Mobile) */}
            <div className="mt-3">
              {!showAddInput ? (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="w-full inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700"
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

            <hr className="my-4 border-gray-200" />

            {/* Flashcard creation forms (mobile-only extra nav) */}
            <h4 className="px-1 mb-2 text-xs uppercase tracking-wide text-gray-500">
              Create Flashcards
            </h4>
            <ul className="space-y-2 mb-4">
              <li>
                <NavLink
                  to="/transcript"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg ${
                      isActive
                        ? "text-blue-600 font-semibold bg-gray-100"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
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
                    `block px-3 py-2 rounded-lg ${
                      isActive
                        ? "text-blue-600 font-semibold bg-gray-100"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  From Youtube / Media
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/manual"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg ${
                      isActive
                        ? "text-blue-600 font-semibold bg-gray-100"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Manual
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Overlay background */}
          <div className="flex-1 bg-black opacity-30" onClick={onClose}></div>
        </div>
      )}
    </>
  );
}
