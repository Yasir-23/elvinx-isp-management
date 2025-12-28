import React from "react";
import { useSettings } from "../context/SettingsContext";

const Footer = () => {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  // If settings are still loading or empty, show a safe default
  const footerText = settings?.copyrightText 
    ? settings.copyrightText 
    : `© ${currentYear} ISP Management System. All rights reserved.`;

  return (
    <footer className="w-full py-6 mt-auto text-center border-t border-gray-800">
      <p className="text-sm text-white-500">
        {footerText}
      </p>
    </footer>
  );
};

export default Footer;