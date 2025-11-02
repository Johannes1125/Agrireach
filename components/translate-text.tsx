"use client";

import React from "react";
import { useTranslation } from "@/hooks/use-translation";

export function TranslateText({
  text,
  children,
  as: Tag = "span",
  loadingFallback = null,
  className,
}: {
  text?: string;
  children?: React.ReactNode; // if provided and text is undefined, will read children as text
  as?: React.ElementType;
  loadingFallback?: React.ReactNode;
  className?: string;
}) {
  const { t, isTranslating } = useTranslation();
  const raw = typeof text === "string" ? text : children?.toString?.() ?? "";
  const [translated, setTranslated] = React.useState<string>(raw);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!raw) {
        setTranslated("");
        return;
      }
      const out = await t(raw);
      if (mounted) setTranslated(out as string);
    })();
    return () => {
      mounted = false;
    };
  }, [raw, t]);

  if (isTranslating && loadingFallback !== null) {
    return <>{loadingFallback}</>;
  }

  return <Tag className={className}>{translated}</Tag>;
}
