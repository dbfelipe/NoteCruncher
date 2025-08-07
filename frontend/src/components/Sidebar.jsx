import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Saved Flashcard Sets</h2>
        <ul className="space-y-2">
          <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
            Biology Set
          </li>
          <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
            CS Review
          </li>
          <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
            Interview Prep
          </li>
        </ul>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-white p-4 shadow-lg z-50">
            <button onClick={onClose} className="mb-4">
              <X className="h-6 w-6 text-gray-600 hover:text-red-500" />
            </button>
            <hr className="my-4 border-gray-200" />

            <h2 className="text-lg font-semibold mb-2">Navigation</h2>
            <ul className="space-y-2">
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
              <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
                Biology Set
              </li>
              <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
                CS Review
              </li>
              <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
                Interview Prep
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
