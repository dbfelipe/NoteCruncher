import { NavLink } from "react-router-dom";
import { Menu, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { signIn, signOut, currentUser } from "../auth";

export default function Navbar({ onMenuClick }) {
  const base =
    "text-sm sm:text-base px-3 py-2 font-medium rounded-lg transition duration-200 hover:bg-[color:var(--surface-2)]";
  const active =
    "bg-[color:var(--surface-2)] text-[color:var(--text)] ring-1 ring-[color:var(--cream-2)]";
  const inactive = "text-[color:var(--text)]";

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await currentUser(); // returns null if not signed in
      setUser(u);
      setLoadingUser(false);
    })();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log("Attempting to sign in...");
      await signIn(); // v6 redirect
    } catch (err) {
      console.error("Login redirect failed:", err);
    }
  }

  async function handleLogout(e) {
    e?.preventDefault?.();
    try {
      await signOut();
      setUser(null);
      setEmail(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

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

        {/* Right: auth controls */}
        <div className="flex items-center gap-3">
          {loadingUser ? (
            <div className="text-sm text-[color:var(--muted)]">…</div>
          ) : !user ? (
            <button
              type="button"
              onClick={handleLogin}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-[color:var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Login
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
                <User className="h-5 w-5" style={{ color: "var(--muted)" }} />
                <span className="text-sm">{email || user?.username}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg border text-sm hover:bg-[color:var(--surface-2)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="hidden md:block h-[2px]"
        style={{ background: "transparent" }}
      />
    </nav>
  );
}
