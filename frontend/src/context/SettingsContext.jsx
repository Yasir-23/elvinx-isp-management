import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const SettingsContext = createContext();

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  // Define the fetching logic as a reusable function
  const fetchSettings = async () => {
    const token = localStorage.getItem("token");
    // If no token, we can't fetch, so stop here.
    if (!token) return;

    try {
      const res = await api.get("/settings");
      setSettings(res.data || null);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  // Run automatically ONCE on mount (handles page refreshes)
  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    // We expose 'fetchSettings' so the Login page can call it!
    <SettingsContext.Provider value={{ settings, setSettings, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return { settings: null, setSettings: () => {}, fetchSettings: () => {} };
  }
  return ctx;
}

export { SettingsProvider, useSettings };