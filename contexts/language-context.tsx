"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";

type LanguageCode = "auto" | "en" | "zh" | "hi" | "es" | "fr";

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  resolvedLang: LanguageCode;
  autoTranslate: boolean;
  setAutoTranslate: (enabled: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Language label map
const LANG_LABELS: Record<LanguageCode, string> = {
  auto: "Auto (device)",
  en: "English",
  zh: "Mandarin Chinese",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
};

// Detect browser language
function detectBrowserLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact matches or language family matches
  if (browserLang.startsWith("en")) return "en";
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("hi")) return "hi";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("fr")) return "fr";
  
  return "en"; // Default to English
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred-language") as LanguageCode;
      return saved && LANG_LABELS[saved] ? saved : "auto";
    }
    return "auto";
  });
  
  const [autoTranslate, setAutoTranslateState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("auto-translate");
      return saved === "true";
    }
    return false;
  });

  // Resolve language (if auto, use browser language)
  const resolvedLang: LanguageCode =
    lang === "auto" ? detectBrowserLanguage() : lang;

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-language", lang);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auto-translate", String(autoTranslate));
    }
  }, [autoTranslate]);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
  };

  const setAutoTranslate = (enabled: boolean) => {
    setAutoTranslateState(enabled);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        resolvedLang,
        autoTranslate,
        setAutoTranslate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

