import { useState, useRef, useEffect, link } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api.js";
import { Link } from "react-router-dom";

/**
 * Topbar
 * Props:
 * - onToggleSidebar() : called when hamburger clicked
 * - title (string)
 * - user (object) { name, avatar }
 */
export default function Topbar({
  onToggleSidebar,
}) {
  const { settings } = useSettings();
  const logoSrc = settings?.logoUrl
    ? settings.logoUrl.startsWith("http")
      ? settings.logoUrl
      : window.location.origin + settings.logoUrl
    : "/logo.png";

  const companyTitle = settings?.companyName || "ElvinX";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await api.get("/admin/me");
        setAdmin(res.data.admin);
      } catch (err) {
        console.error("Failed to load admin for topbar", err);
      }
    };

    fetchAdmin();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between bg-gray-800 px-4 py-2 shadow-sm text-gray-100">
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-700 transition"
        >
          {/* hamburger */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>

        {/* logo + title */}
        <div className="flex items-center gap-3">
          {/* <img src={`http://localhost:3000${settings.logoUrl}`} alt="Brand Logo" className="w-8 h-8 rounded-full object-cover" /> */}
          <Link to="/">
          <img
            src={logoSrc}
            alt="Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
          </Link>
          <div className="hidden sm:block">
            <Link to="/">
            <div className="text-sm font-semibold">
              {companyTitle || "ElvinXYasir"}
            </div>
            </Link>
            <div className="text-xs text-gray-400">
              {settings?.slogan || "Easy, Clean and Simple"}
            </div>
          </div>
        </div>
      </div>

      {/* right side: user dropdown */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-3 focus:outline-none"
        >
          <div className="hidden md:flex text-right text-sm font-medium text-white">
            {admin?.name || "Admin"}
          </div>

          <img
            src={admin?.photoUrl || "/avatar.png"}
            alt="avatar"
            className="w-8 h-8 rounded-full border border-gray-700 object-cover"
          />

          <ChevronDown size={16} className="text-gray-400 hidden md:block" />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/admin");
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              <User size={16} />
              Profile
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              <Settings size={16} />
              Settings
            </button>

            <div className="border-t border-gray-700 my-1" />

            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
