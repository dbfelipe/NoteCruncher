import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";

export default function SetRow({
  set, // { id, name, created_at, card_count }
  rightExtras, // optional React node (e.g., “Remove” button in FolderDetail)
  onDelete, // (id) => void
}) {
  return (
    <li>
      <div
        className="flex items-center justify-between rounded-xl border p-4 transition hover:opacity-90"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Left side (name + created_at) */}
        <Link to={`/sets/${set.id}`} className="flex-1">
          <div className="font-medium" style={{ color: "var(--text)" }}>
            {set.name}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {set.created_at ? new Date(set.created_at).toLocaleString() : ""}
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-4">
          {rightExtras}
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(set.id, e);
            }}
            className="transition"
            style={{ color: "#b42318" }}
            aria-label="Delete set"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
