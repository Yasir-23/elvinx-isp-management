import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// Lucide Icons
import {
  Home,
  UserPlus,
  Users,
  FilePlus2,
  FolderOpen,
  PackagePlus,
  Package,
  FileText,
  CreditCard,
  Wallet,
  MapPin,
  UserCog,
  Upload,
  Settings,
  LogOut,
  Radio, // for Network
} from "lucide-react";

export default function Sidebar({ open = true }) {
  const [usersOpen, setUsersOpen] = useState(false);
  const { settings } = useSettings();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let userRole = "";
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role;
    }
  } catch (e) {
    console.error("JWT parse error in Sidebar:", e);
  }

  const nav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/admin", label: "Profile", icon: UserCog },
    ...(userRole === "SUPER_ADMIN" ? [{ to: "/network", label: "Network", icon: Radio }] : []),
    { to: "/staff", label: "Staff", icon: UserCog },
    { to: "/users/add", label: "Add User", icon: UserPlus },
    { to: "/users", label: "All Users", icon: Users },
    ...(["SUPER_ADMIN", "FRANCHISE"].includes(userRole) ? [
      { to: "/addpackage", label: "Add Package", icon: PackagePlus },
      { to: "/allpackages", label: "All Packages", icon: Package },
    ] : []),
    { to: "/addinvoices", label: "Add Bill/Invoice", icon: FilePlus2 },
    { to: "/browsebills", label: "Browse Bills", icon: FolderOpen },
    ...(userRole === "SUPER_ADMIN" ? [{ to: "/settings", label: "Settings", icon: Settings }] : []),
    { to: "/logout", label: "Logout", icon: LogOut },
  ];

  // FIX LOGO URL
  const logoSrc = settings?.logoUrl
    ? settings.logoUrl.startsWith("http")
      ? settings.logoUrl
      : window.location.origin + settings.logoUrl
    : "/logo.png";

  return (
    <aside
      className={`flex-shrink-0 ${open ? "w-64" : "w-16"
        } bg-gray-900 text-gray-200 h-screen transition-all duration-200 overflow-y-auto`}
    >
      <div className="p-4">
        <Link to="/">
          <div className="flex items-center gap-3">
            <img
              src={settings?.logoUrl || "/logo.png"}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            {open && <div className="text-white font-bold text-lg">ElvinX</div>}
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="mt-6 space-y-1">
          {nav.map((n) =>
            n.children ? (
              <div key={n.label}>
                {/* Parent menu */}
                <button
                  onClick={() => setUsersOpen(!usersOpen)}
                  className={`flex items-center w-full ${open ? "gap-3 px-3 justify-start" : "justify-center px-0"
                    } py-2 rounded-md hover:bg-gray-800 transition`}
                >
                  <n.icon size={18} className="w-6 text-center" />
                  {open && (
                    <span className="text-sm flex-1 text-left">{n.label}</span>
                  )}
                  {open && <span>{usersOpen ? "▾" : "▸"}</span>}
                </button>

                {/* Submenu */}
                {usersOpen && open && (
                  <div className="ml-8 mt-1 space-y-1">
                    {n.children.map((c) => (
                      <NavLink
                        key={c.to}
                        to={c.to}
                        end
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 transition ${isActive ? "bg-white/5" : ""
                          }`
                        }
                      >
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : n.to === "/logout" ? (
              // 🔴 LOGOUT (special case)
              <button
                key={n.to}
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
                className={`flex items-center w-full ${open ? "gap-3 px-3 justify-start" : "justify-center px-0"
                  } py-2 rounded-md hover:bg-gray-800 transition text-left`}
              >
                <n.icon size={18} className="w-6 flex-shrink-0" />
                {open && <span className="text-sm">{n.label}</span>}
              </button>
            ) : (
              // 🟢 NORMAL NAV LINK
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  `flex items-center ${open ? "gap-3 px-3 justify-start" : "justify-center px-0"
                  } py-2 rounded-md hover:bg-gray-800 transition ${isActive ? "bg-white/5" : ""
                  }`
                }
              >
                <n.icon size={18} className="w-6 flex-shrink-0" />
                {open && <span className="text-sm">{n.label}</span>}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
