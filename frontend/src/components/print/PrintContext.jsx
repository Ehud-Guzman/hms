import React, { createContext, useContext, useEffect, useState } from 'react';
import settingsService from '../../modules/settings/services/settingsService'; 

const PrintContext = createContext();

export const usePrint = () => useContext(PrintContext);

export const PrintProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Fetch hospital settings (you might already have them in a global store)
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings(); // implement this
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch print settings', error);
      }
    };
    fetchSettings();
  }, []);

  const headerText = settings?.printHeaderText || 'Hospital Name';
  const footerText = settings?.printFooterText || 'Confidential';
  const logoUrl = settings?.brandLogoUrl;

  return (
    <PrintContext.Provider value={{ headerText, footerText, logoUrl }}>
      {children}
    </PrintContext.Provider>
  );
};