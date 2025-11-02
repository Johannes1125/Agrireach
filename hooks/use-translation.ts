"use client";

import { useLanguage } from "@/contexts/language-context";

export function useTranslation() {
  const { language, setLanguage, isTranslating, t } = useLanguage();
  // Provide both canonical and backward-compatible aliases
  return {
    // canonical
    language,
    setLanguage,
    // aliases
    lang: language,
    setLang: setLanguage,
    // state and translate fn
    isTranslating,
    t,
    // additional aliases for compatibility with existing components
    translate: t,
    enabled: language !== "en",
  } as const;
}
