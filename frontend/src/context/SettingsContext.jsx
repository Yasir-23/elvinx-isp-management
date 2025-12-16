import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api"; // ✅ use axios instance

const SettingsContext = createContext();

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    // ⛔ Don't fetch settings before login — avoid 401 errors
    const token = localStorage.getItem("token");
    if (!token) return;

    async function loadSettings() {
      try {
        const res = await api.get("/settings");  // ✅ uses baseURL + token
        if (!mounted) return;
        setSettings(res.data || null);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return { settings: null, setSettings: () => {} };
  }
  return ctx;
}

export { SettingsProvider, useSettings };
