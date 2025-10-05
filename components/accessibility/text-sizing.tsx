"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TextSizingProps {
  minSize?: number; 
  maxSize?: number; 
  step?: number;
  persistKey?: string;
}

export const TextSizing: React.FC<TextSizingProps> = ({
  minSize = 80,
  maxSize = 150,
  step = 10,
  persistKey = "agrireach-font-size",
}) => {
  const [fontSize, setFontSize] = useState<number>(100);

  useEffect(() => {
    const savedSize = localStorage.getItem(persistKey);
    if (savedSize) {
      const parsedSize = parseInt(savedSize, 10);
      if (
        !isNaN(parsedSize) &&
        parsedSize >= minSize &&
        parsedSize <= maxSize
      ) {
        setFontSize(parsedSize);
        applyFontSize(parsedSize);
      }
    }
  }, [minSize, maxSize, persistKey]);

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}%`;
    localStorage.setItem(persistKey, size.toString());
  };

  const increaseFontSize = () => {
    if (fontSize + step <= maxSize) {
      const newSize = fontSize + step;
      setFontSize(newSize);
      applyFontSize(newSize);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize - step >= minSize) {
      const newSize = fontSize - step;
      setFontSize(newSize);
      applyFontSize(newSize);
    }
  };

  const resetFontSize = () => {
    setFontSize(100);
    applyFontSize(100);
  };

  return (
    <div className="flex items-center gap-2" aria-label="Text sizing controls">
      <Button
        variant="outline"
        size="sm"
        onClick={decreaseFontSize}
        disabled={fontSize <= minSize}
        aria-label="Decrease text size"
        title="Decrease text size"
      >
        <span className="text-sm">A-</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={resetFontSize}
        aria-label="Reset text size"
        title="Reset text size"
      >
        <span className="text-sm">{fontSize}%</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={increaseFontSize}
        disabled={fontSize >= maxSize}
        aria-label="Increase text size"
        title="Increase text size"
      >
        <span className="text-sm">A+</span>
      </Button>
    </div>
  );
};

export default TextSizing;
