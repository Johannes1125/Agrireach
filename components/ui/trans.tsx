"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface TransProps {
  text: string;
  className?: string;
  html?: boolean;
}

export default function Trans({
  text,
  className = "",
  html = false,
}: TransProps) {
  const { enabled, translate, language } = useTranslation();
  const [out, setOut] = useState(text);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!text) return setOut("");
      if (!enabled) return setOut(text);

      try {
        try {
          console.debug("[Trans] translating", { text });
        } catch {}
        const t = await translate(text as string);
        if (mounted) {
          setOut(t);
          try {
            console.debug("[Trans] translated", { input: text, output: t });
          } catch {}
        }
      } catch {
        if (mounted) setOut(text);
      }
    }

    try {
      console.debug("[Trans] effect trigger", { language, enabled, text });
    } catch {}
    run();
    return () => {
      mounted = false;
    };
  }, [text, enabled, translate, language]);

  return <span className={className}>{out}</span>;
}
