// frontend/src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api";

/*
  Settings page:
  - GET /api/settings on load
  - POST /api/settings (multipart/form-data) on save
  - file inputs for logo & favicon (no preview in form)
  - defaultCurrency default to PKR
  - defaultPaymentMethod: EasyPaisa
  - defaultEmailApi, defaultSmsApi: common providers
  - sendSmsOnInvoice, sendEmailOnInvoice: On/Off toggles
*/

const CURRENCIES = [
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  // ... rest unchanged
];

const EMAIL_APIS = ["SMTP", "SendGrid", "Mailgun", "Amazon SES", "Postmark", "Custom"];
const SMS_APIS = ["Twilio", "Nexmo", "Plivo", "Infobip", "LocalProvider", "Custom"];

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

      alert("Settings saved successfully");
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save settings — check server logs for details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 w-full">
      {/* Header / title like screenshot */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-md mb-6">
        <div className="text-2xl">⚙️</div>
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm opacity-90">
            Configure general site & billing options
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-md shadow"
      >
        {/* Row: Logo & Favicon (file pickers only) */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo
            </label>
            <input
              type="file"
              name="logo"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1"
            />
            {logoFile ? (
              <div className="text-xs text-gray-500 mt-1">
                Selected: {logoFile.name}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">
                Upload a logo — it will be used site-wide after saving.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Favicon
            </label>
            <input
              type="file"
              name="favicon"
              accept=".ico,image/*"
              onChange={handleFileChange}
              className="mt-1"
            />
            {faviconFile ? (
              <div className="text-xs text-gray-500 mt-1">
              Selected: {faviconFile.name}
            </div>) : (
              <div className="text-xs text-gray-500 mt-1">
            Upload a favicon (.ico or png) — browser may cache old favicon until refresh.
            </div>
            )}
          </div>
        </div>

        {/* Company fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            name="companyName"
            value={settings.companyName || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Slogan
          </label>
          <input
            name="slogan"
            value={settings.slogan || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile
            </label>
            <input
              name="mobile"
              value={settings.mobile || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={settings.email || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            name="website"
            value={settings.website || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>

        {/* Payments */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Currency
            </label>
            <select
              name="defaultCurrency"
              value={settings.defaultCurrency || "PKR"}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Payment Method
            </label>
            <select
              name="defaultPaymentMethod"
              value={settings.defaultPaymentMethod || "EasyPaisa"}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              <option>EasyPaisa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Payment Recipient
            </label>
            <input
              name="defaultPaymentRecipient"
              value={settings.defaultPaymentRecipient || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default VAT (%)
            </label>
            <input
              type="number"
              step="0.01"
              name="defaultVAT"
              value={settings.defaultVAT || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>

        {/* API providers and toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Email API
            </label>
            <select
              name="defaultEmailApi"
              value={settings.defaultEmailApi || "SMTP"}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              {EMAIL_APIS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default SMS API
            </label>
            <select
              name="defaultSmsApi"
              value={settings.defaultSmsApi || "Twilio"}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              {SMS_APIS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Send SMS On New Bills & Invoice
            </label>
            <select
              name="sendSmsOnInvoice"
              value={settings.sendSmsOnInvoice ? "on" : "off"}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  sendSmsOnInvoice: e.target.value === "on",
                }))
              }
              className="border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Send Email On New Bills & Invoice
            </label>
            <select
              name="sendEmailOnInvoice"
              value={settings.sendEmailOnInvoice ? "on" : "off"}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  sendEmailOnInvoice: e.target.value === "on",
                }))
              }
              className="border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        {/* Mikrotik credentials */}
        <div className="mt-2 text-sm text-gray-700 font-medium">
          MikroTik (set the router IP and credentials here)
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mikrotik IP
            </label>
            <input
              name="mikrotikIp"
              value={settings.mikrotikIp || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mikrotik User
            </label>
            <input
              name="mikrotikUser"
              value={settings.mikrotikUser || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mikrotik Password
            </label>
            <input
              type="password"
              name="mikrotikPassword"
              value={settings.mikrotikPassword || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Address block */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            name="address"
            value={settings.address || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              name="city"
              value={settings.city || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              name="country"
              value={settings.country || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Zip Code
            </label>
            <input
              name="zipCode"
              value={settings.zipCode || ""}
              onChange={handleInputChange}
              className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Copyright Text
          </label>
          <input
            name="copyrightText"
            value={settings.copyrightText || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "✅ Save Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
