// frontend/src/components/FaviconUpdater.jsx
import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * Dynamically updates the <link rel="icon"> and <link rel="shortcut icon">
 * when settings.faviconUrl changes.
 */
export default function FaviconUpdater() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings || !settings.faviconUrl) return;

    const backend = "http://localhost:3000"; // <-- your backend server
    const src = settings.faviconUrl.startsWith("http")
    ? settings.faviconUrl
    : backend + settings.faviconUrl;

    const href = `${src}?v=${Date.now()}`; // bust browser cache

    // Remove any old favicons
    document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());

    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png"; // or image/x-icon if .ico
    link.href = href;
    document.head.appendChild(link);

    // (Optional) Add "shortcut icon" for older browsers
    const shortcut = document.createElement("link");
    shortcut.rel = "shortcut icon";
    shortcut.type = "image/png";
    shortcut.href = href;
    document.head.appendChild(shortcut);
  }, [settings]);

  return null;
}
