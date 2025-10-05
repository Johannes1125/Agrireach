"use client";

import React from "react";

interface LanguageMarkerProps {
 
  lang: string;

  children: React.ReactNode;

  className?: string;
}

export function LanguageMarker({
  lang,
  children,
  className,
}: LanguageMarkerProps) {
  return (
    <span lang={lang} className={className}>
      {children}
    </span>
  );
}

export function ProductLanguageMarker({
  lang,
  children,
  productName,
}: LanguageMarkerProps & { productName?: string }) {
  return (
    <div
      lang={lang}
      aria-label={
        productName
          ? `${productName} description in ${getLanguageName(lang)}`
          : undefined
      }
    >
      {children}
    </div>
  );
}


function getLanguageName(langCode: string): string {
  try {
    return (
      new Intl.DisplayNames([navigator.language], { type: "language" }).of(
        langCode
      ) || langCode
    );
  } catch (e) {

    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      pt: "Portuguese",
      de: "German",
      it: "Italian",
      zh: "Chinese",
      ja: "Japanese",
      ru: "Russian",
    };

    return languages[langCode] || langCode;
  }
}
