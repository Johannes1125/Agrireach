'use client';

import React, { createContext, useState, useContext, useEffect } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface AccessibilityContextType {

    highContrast: boolean;
  toggleHighContrast: () => void;

  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;

  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;

  focusVisible: boolean;
  setFocusVisible: (value: boolean) => void;

  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {

    const [highContrast, setHighContrast] = useState(false);

  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);

  const [fontSize, setFontSize] = useState(100);

  const [focusVisible, setFocusVisible] = useState(true);

  useEffect(() => {
    const storedHighContrast = localStorage.getItem("agrireach-high-contrast");
    if (storedHighContrast) setHighContrast(storedHighContrast === "true");

    const storedReducedMotion = localStorage.getItem(
      "agrireach-reduced-motion"
    );
    if (storedReducedMotion) {
      setReducedMotion(storedReducedMotion === "true");
    } else {
        setReducedMotion(systemReducedMotion);
    }

    const storedFontSize = localStorage.getItem("agrireach-font-size");
    if (storedFontSize) {
      const parsed = parseInt(storedFontSize, 10);
      if (!isNaN(parsed) && parsed >= 80 && parsed <= 150) {
        setFontSize(parsed);
        document.documentElement.style.fontSize = `${parsed}%`;
      }
    }

    const storedFocusVisible = localStorage.getItem("agrireach-focus-visible");
    if (storedFocusVisible) setFocusVisible(storedFocusVisible === "true");
  }, [systemReducedMotion]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("agrireach-high-contrast", highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
    localStorage.setItem("agrireach-reduced-motion", reducedMotion.toString());
  }, [reducedMotion]);

  useEffect(() => {
    if (focusVisible) {
      document.documentElement.classList.remove("no-focus-visible");
    } else {
      document.documentElement.classList.add("no-focus-visible");
    }
    localStorage.setItem("agrireach-focus-visible", focusVisible.toString());
  }, [focusVisible]);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      const newSize = Math.min(fontSize + 10, 150);
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
      localStorage.setItem("agrireach-font-size", newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 80) {
      const newSize = Math.max(fontSize - 10, 80);
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
      localStorage.setItem("agrireach-font-size", newSize.toString());
    }
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = "100%";
    localStorage.setItem("agrireach-font-size", "100");
  };

  const toggleHighContrast = () => setHighContrast(!highContrast);

  const announce = (
    message: string,
    politeness: "polite" | "assertive" = "polite"
  ) => {
    const liveRegion = document.getElementById(
      politeness === "assertive"
        ? "assertive-live-region"
        : "polite-live-region"
    );

    if (liveRegion) {
      liveRegion.textContent = message;

      if (message) {
        setTimeout(() => {
          liveRegion.textContent = "";
        }, 3000);
      }
    }
  };

  const value = {
    highContrast,
    toggleHighContrast,

    reducedMotion,
    setReducedMotion,

    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,

    focusVisible,
    setFocusVisible,

    announce,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {}
      <div
        id="polite-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      ></div>
      <div
        id="assertive-live-region"
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
      ></div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};

export default AccessibilityProvider;
