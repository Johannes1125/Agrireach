"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface SkipToContentProps {
  mainContentId?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  mainContentId = "main-content",
}) => {
  const router = useRouter();

  const handleSkip = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();

    const mainContent = document.getElementById(mainContentId);

    if (mainContent) {
      const hasTabIndex = mainContent.hasAttribute("tabindex");
      if (!hasTabIndex) {
        mainContent.setAttribute("tabindex", "-1");
      }

      mainContent.focus();

      if (!hasTabIndex) {
        setTimeout(() => {
          mainContent.removeAttribute("tabindex");
        }, 100);
      }
    }
  };

  return (
    <a
      href={`#${mainContentId}`}
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSkip(e);
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 z-50 p-4 m-2 bg-primary text-primary-foreground rounded shadow-lg"
    >
      Skip to content
    </a>
  );
};

export default SkipToContent;
