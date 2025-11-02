"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

// Fallback supported languages (public LibreTranslate often supports these)
const FALLBACK_LANGS: Array<{ value: string; label: string }> = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "hi", label: "हिंदी" },
  { value: "zh", label: "中文" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "日本語" },
];

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang } = useTranslation();
  const [languages, setLanguages] = useState(FALLBACK_LANGS);

  useEffect(() => {
    // Try to fetch supported languages from server; fall back on known list
    (async () => {
      try {
        const res = await fetch("/api/translate/languages", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const codes: string[] = data?.data?.languages || [];
        if (Array.isArray(codes) && codes.length > 0) {
          const mapped = codes
            .filter((c) => typeof c === "string")
            .map((c) => ({ value: c, label: c.toUpperCase() }));
          setLanguages((prev) => {
            // Ensure 'en' and common labels are user-friendly
            const lookup: Record<string, string> = Object.fromEntries(
              FALLBACK_LANGS.map((x) => [x.value, x.label])
            );
            return mapped.map((m) => ({
              value: m.value,
              label: lookup[m.value] || m.label,
            }));
          });
        }
      } catch (e) {
        // ignore and keep fallback list
      }
    })();
  }, []);

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span>Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="border rounded px-2 py-1"
        aria-label="Language selector"
      >
        {languages.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
