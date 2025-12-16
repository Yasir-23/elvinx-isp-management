import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

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
  Radio // for Network
} from "lucide-react";

export default function Sidebar({ open = true }) {
  const [usersOpen, setUsersOpen] = useState(false);
  const { settings } = useSettings();

  const nav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/users/add", label: "Add User", icon: UserPlus },
    { to: "/users", label: "All Users", icon: Users },
    { to: "/bills", label: "Add Bill/Invoice", icon: FilePlus2 },
    { to: "/bills/new", label: "Browse Bills", icon: FolderOpen },
    { to: "/addpackages", label: "Add Package", icon: PackagePlus },
    { to: "/allpackages", label: "All Packages", icon: Package },
    { to: "/invoices", label: "Invoices", icon: FileText },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/incomeexpense", label: "Income/Expense", icon: Wallet },
    { to: "/areas", label: "Area", icon: MapPin },
    { to: "/staff", label: "Staff", icon: UserCog },
    { to: "/import", label: "Import", icon: Upload },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/logout", label: "Logout", icon: LogOut },
    { to: "/network", label: "Network", icon: Radio },
  ];

  // FIX LOGO URL
  const logoSrc = settings?.logoUrl
    ? (settings.logoUrl.startsWith("http")
        ? settings.logoUrl
        : window.location.origin + settings.logoUrl)
    : "/logo.png";

  return (
    <aside
      className={`flex-shrink-0 ${
        open ? "w-64" : "w-16"
      } bg-gray-900 text-gray-200 h-screen transition-all duration-200 overflow-y-auto`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={settings?.logoUrl ? `http://localhost:3000${settings.logoUrl}` : "/logo.png"}
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          {open && (
            <div className="text-white font-bold text-lg">
              ElvinX
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="mt-6 space-y-1">
          {nav.map((n) =>
            n.children ? (
              <div key={n.label}>
                {/* Parent menu */}
                <button
                  onClick={() => setUsersOpen(!usersOpen)}
                  className="flex items-center w-full gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition"
                >
                  <n.icon size={18} className="w-6 text-center" />
                  {open && (
                    <span className="text-sm flex-1 text-left">
                      {n.label}
                    </span>
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
                          `block px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 transition ${
                            isActive ? "bg-white/5" : ""
                          }`
                        }
                      >
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition ${
                    isActive ? "bg-white/5" : ""
                  }`
                }
              >
                <n.icon size={18} className="w-6" /> {/* LUCIDE ICON */}
                {open && <span className="text-sm">{n.label}</span>}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
