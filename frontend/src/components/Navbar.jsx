import { NavLink } from "react-router-dom";
import { Menu, User } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  const base =
    "text-sm sm:text-base px-3 py-2 font-medium rounded-lg transition duration-200 hover:bg-[color:var(--surface-2)]";
  const active =
    "bg-[color:var(--surface-2)] text-[color:var(--text)] ring-1 ring-[color:var(--cream-2)]";
  const inactive = "text-[color:var(--text)]";

  return (
    <nav
      className="border-b"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      <div className="w-full px-4 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <button
            className="md:hidden p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" style={{ color: "var(--muted)" }} />
          </button>
          <span className="font-bold text-xl tracking-tight">NoteCrunch</span>
        </div>

        {/* Center */}
        <div className="hidden md:flex items-center space-x-2">
          <NavLink
            to="/transcript"
            className={({ isActive }) =>
              `${base} ${isActive ? active : inactive}`
            }
          >
            From Notes
          </NavLink>
          <NavLink
            to="/links"
            className={({ isActive }) =>
              `${base} ${isActive ? active : inactive}`
            }
          >
            From Youtube / Media
          </NavLink>
          <NavLink
            to="/manual"
            className={({ isActive }) =>
              `${base} ${isActive ? active : inactive}`
            }
          >
            Manual
          </NavLink>
        </div>

        {/* Right */}
        <div className="flex items-center">
          <User className="h-6 w-6" style={{ color: "var(--muted)" }} />
        </div>
      </div>

      {/* Optional thin tan underline for current route (mobile-friendly) */}
      <div
        className="hidden md:block h-[2px]"
        style={{ background: "transparent" }}
      />
    </nav>
  );
}
