import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "internarea_lang";

/** Reads the saved language from localStorage, defaulting to 'en'. */
function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ["en", "es", "hi", "pt", "zh", "fr"].includes(saved)) {
      return saved;
    }
  } catch (e) {
    // localStorage not available (SSR / private mode)
  }
  return "en";
}

/** Saves the language to localStorage. */
function persistLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // ignore
  }
}

/**
 * LanguageProvider — wraps the entire app and provides:
 *   - language: current language code (e.g. "en", "fr")
 *   - setLanguage: directly change language (non-French only — French needs OTP)
 *   - t(key): translate a key to the current language
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getSavedLanguage);

  // Sync language from backend user data when user logs in
  const syncLanguageFromUser = (user) => {
    if (user?.preferredLanguage && user.preferredLanguage !== language) {
      setLanguageState(user.preferredLanguage);
      persistLanguage(user.preferredLanguage);
    }
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    persistLanguage(lang);
  };

  /**
   * Translate a key. Returns the string for the current language,
   * falls back to English if not found, then falls back to the key itself.
   */
  const t = (key) => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, syncLanguageFromUser }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook to access the language context from any component. */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a <LanguageProvider>");
  }
  return ctx;
}

export default LanguageContext;
