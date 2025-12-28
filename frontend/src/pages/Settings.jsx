// frontend/src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api";
import { toast } from "react-hot-toast";

/*
  Settings page:
  - GET /api/settings on load
  - POST /api/settings (multipart/form-data) on save
  - file inputs for logo & favicon (no preview in form)
*/


const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    logoUrl: null,
    faviconUrl: null,
    companyName: "",
    slogan: "",
    mobile: "",
    email: "",
    website: "",
    defaultCurrency: "PKR",
    defaultPaymentMethod: "EasyPaisa",
    defaultPaymentRecipient: "",
    defaultVAT: "",
    defaultEmailApi: "SMTP",
    defaultSmsApi: "Twilio",
    sendSmsOnInvoice: false,
    sendEmailOnInvoice: false,
    mikrotikIp: "",
    mikrotikUser: "",
    mikrotikPassword: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
    copyrightText: "",
  });

  const { setSettings: setGlobalSettings } = useSettings();

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  // ================================
  //  Load settings
  // ================================
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) return; // ⛔ prevent 401 error before login

    api.get("/settings")
      .then((res) => {
        if (!mounted) return;
        if (!res.data) return;

        const s = {
          ...settings,
          ...res.data,
          sendSmsOnInvoice: !!res.data.sendSmsOnInvoice,
          sendEmailOnInvoice: !!res.data.sendEmailOnInvoice,
        };

        setSettings(s);
      })
      .catch((err) => {
        console.error("GET settings failed:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleFileChange(e) {
    const { name, files } = e.target;
    if (!files?.length) return;

    if (name === "logo") {
      setLogoFile(files[0]);
      setSettings((prev) => ({
        ...prev,
        logoUrl: URL.createObjectURL(files[0]),
      }));
    } else if (name === "favicon") {
      setFaviconFile(files[0]);
      setSettings((prev) => ({
        ...prev,
        faviconUrl: URL.createObjectURL(files[0]),
      }));
    }
  }

  // ================================
  // Save settings
  // ================================
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();

      Object.entries(settings).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      if (logoFile) formData.append("logo", logoFile);
      if (faviconFile) formData.append("favicon", faviconFile);

      const res = await api.post("/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
        setGlobalSettings((prev) => ({ ...prev, ...res.data }));
      }

      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Failed to save settings — check server logs for details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 w-full">
      {/* Header / title */}
      <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 mb-6">
        <div className="text-2xl">⚙️</div>
        <div>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
          <p className="text-sm text-gray-400">
            Configure general site & mikrotik credentials
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg"
      >
        {/* Row: Logo & Favicon (file pickers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Logo
            </label>
            <div className="bg-gray-700 border border-gray-600 rounded p-3">
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500 cursor-pointer"
              />
              {logoFile ? (
                <div className="text-xs text-green-400 mt-2">
                  Selected: {logoFile.name}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-2">
                  Upload a logo — it will be used site-wide.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Favicon
            </label>
            <div className="bg-gray-700 border border-gray-600 rounded p-3">
              <input
                type="file"
                name="favicon"
                accept=".ico,image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500 cursor-pointer"
              />
              {faviconFile ? (
                <div className="text-xs text-green-400 mt-2">
                  Selected: {faviconFile.name}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-2">
                  Upload a favicon (.ico or png).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Company Name
            </label>
            <input
              name="companyName"
              value={settings.companyName || ""}
              onChange={handleInputChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Slogan
            </label>
            <input
              name="slogan"
              value={settings.slogan || ""}
              onChange={handleInputChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Mobile
            </label>
            <input
              name="mobile"
              value={settings.mobile || ""}
              onChange={handleInputChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={settings.email || ""}
              onChange={handleInputChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400">
            Website
          </label>
          <input
            name="website"
            value={settings.website || ""}
            onChange={handleInputChange}
            className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Mikrotik credentials */}
        <div className="pt-4 border-t border-gray-700">
          <div className="text-lm font-semibold mb-3">
            MikroTik Configuration
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Router IP
              </label>
              <input
                name="mikrotikIp"
                value={settings.mikrotikIp || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                User
              </label>
              <input
                name="mikrotikUser"
                value={settings.mikrotikUser || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <input
                type="password"
                name="mikrotikPassword"
                value={settings.mikrotikPassword || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address block */}
        <div className="pt-4 border-t border-gray-700">
          <div className="text-lm font-semibold mb-3">
            Location Details
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Address
            </label>
            <input
              name="address"
              value={settings.address || ""}
              onChange={handleInputChange}
              className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">
                City
              </label>
              <input
                name="city"
                value={settings.city || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Country
              </label>
              <input
                name="country"
                value={settings.country || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Zip Code
              </label>
              <input
                name="zipCode"
                value={settings.zipCode || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-400">
            Copyright Text
          </label>
          <input
            name="copyrightText"
            value={settings.copyrightText || ""}
            onChange={handleInputChange}
            className="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-3 text-sm rounded border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-white transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
