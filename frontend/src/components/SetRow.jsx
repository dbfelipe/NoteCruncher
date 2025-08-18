import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";

export default function SetRow({
  set, // { id, name, created_at, card_count }
  rightExtras, // optional React node (e.g., “Remove” button in FolderDetail)
  onDelete, // (id) => void
}) {
  return (
    <li>
      <div className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm hover:shadow transition">
        {/* Left side (name + created_at) */}
        <Link to={`/sets/${set.id}`} className="flex-1">
          <div className="font-medium">{set.name}</div>
          <div className="text-xs text-gray-500">
            {set.created_at ? new Date(set.created_at).toLocaleString() : ""}
          </div>
        </Link>

        {/* Right side (delete button only) */}
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(set.id, e);
            }}
            className="text-red-500 hover:text-red-700 transition"
            aria-label="Delete set"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
