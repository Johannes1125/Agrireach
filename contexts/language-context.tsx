"use client";

import React from "react";
import { translate as translateAny } from "@/lib/translate";

type LanguageContextValue = {
  language: string;
  setLanguage: (lang: string) => void;
  isTranslating: boolean;
  t: <T extends string | Record<string, string> | Array<string>>(
    input: T
  ) => Promise<T>;
};

const LanguageContext = React.createContext<LanguageContextValue | undefined>(
  undefined
);

const COOKIE_NAME = "lang";
const LS_KEY = "app_lang";

function getInitialLang(defaultLang = "en"): string {
  if (typeof window === "undefined") return defaultLang;
  const urlParam = new URLSearchParams(window.location.search).get("lang");
  if (urlParam) return urlParam;
  const stored = window.localStorage.getItem(LS_KEY);
  if (stored) return stored;
  const cookieMatch = document.cookie
    .split("; ")
    .find((row) => row.startsWith(COOKIE_NAME + "="));
  const cookieVal = cookieMatch?.split("=")[1];
  return cookieVal || defaultLang;
}

export function LanguageProvider({
  children,
  defaultLang = "en",
}: {
  children: React.ReactNode;
  defaultLang?: string;
}) {
  const [language, setLanguageState] = React.useState<string>(() =>
    getInitialLang(defaultLang)
  );
  const [isTranslating, setIsTranslating] = React.useState(false);

  const setLanguage = React.useCallback((next: string) => {
    try {
      console.log("[LanguageProvider] setLanguage", { next });
    } catch {}
    setLanguageState(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_KEY, next);
        const expires = new Date(
          Date.now() + 365 * 24 * 3600 * 1000
        ).toUTCString();
        document.cookie = `${COOKIE_NAME}=${next}; path=/; expires=${expires}; SameSite=Lax`;
      }
    } catch {
      // ignore
    }
  }, []);

  const t = React.useCallback(
    async <T extends string | Record<string, string> | Array<string>>(
      input: T
    ) => {
      setIsTranslating(true);
      try {
        const res = (await translateAny(input as any, language)) as T;
        return res;
      } finally {
        setIsTranslating(false);
      }
    },
    [language]
  );

  const value = React.useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, isTranslating, t }),
    [language, setLanguage, isTranslating, t]
  );

  React.useEffect(() => {
    try {
      console.log("[LanguageProvider] language changed", { language });
    } catch {}
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
