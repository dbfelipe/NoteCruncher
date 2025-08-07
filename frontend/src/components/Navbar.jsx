import { NavLink } from "react-router-dom";
import { Menu, User } from "lucide-react"; // optional icons

export default function Navbar({ onMenuClick }) {
  const navItem =
    "text-sm sm:text-base px-3 py-2 font-medium transition duration-200";
  const active = "text-blue-600 border-b-2 border-blue-600";
  const inactive = "text-gray-600 hover:text-blue-500";

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between md:pl-64">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            className="md:hidden text-gray-600 focus:outline-none"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5 text-gray-500 cursor-pointer" />
          </button>
          <span className="font-bold text-xl tracking-tight">NoteCrunch</span>
        </div>

        {/* Center Navigation */}
        <div className="hidden md:flex space-x-6">
          <NavLink
            to="/transcript"
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive}`
            }
          >
            From Transcript
          </NavLink>
          <NavLink
            to="/links"
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive}`
            }
          >
            From Links / Files
          </NavLink>
          <NavLink
            to="/manual"
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive}`
            }
          >
            Manual
          </NavLink>
        </div>

        {/* Right Section */}
        <div className="flex items-center">
          <User className="h-6 w-6 text-gray-600 cursor-pointer" />
        </div>
      </div>
    </nav>
  );
}
