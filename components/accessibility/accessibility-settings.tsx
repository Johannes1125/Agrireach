"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAccessibility } from "./accessibility-provider";
import { TextSizing } from "./text-sizing";
import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";

interface AccessibilitySettingsProps {
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "middle-left"
    | "middle-right";
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  position = "middle-left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [defaultPositionClass, setDefaultPositionClass] =
    useState<AccessibilitySettingsProps["position"]>(position);
  const [isCustomPosition, setIsCustomPosition] = useState(false);

  const {
    highContrast,
    toggleHighContrast,
    reducedMotion,
    setReducedMotion,
    focusVisible,
    setFocusVisible,
    announce,
  } = useAccessibility();

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem("accessibility-button-position");
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        if (position.x !== undefined && position.y !== undefined) {
          setButtonPosition(position);
          setIsCustomPosition(true);
        }
      } catch (e) {
        console.error("Error parsing saved position:", e);
      }
    }
  }, []);

  // Save position to localStorage 
  useEffect(() => {
    if (isCustomPosition) {
      localStorage.setItem(
        "accessibility-button-position",
        JSON.stringify(buttonPosition)
      );
    }
  }, [buttonPosition, isCustomPosition]);

  const handleToggle = (e: React.MouseEvent) => {

    if (isDragging) {
      e.preventDefault();
      return;
    }

    setIsOpen(!isOpen);
    if (!isOpen) {
      announce("Accessibility settings panel opened");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && isOpen) {
      setIsOpen(false);
      announce("Accessibility settings panel closed");
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const buttonWidth = 48; 
    const buttonHeight = 48; 

    const newX = Math.max(
      0,
      Math.min(window.innerWidth - buttonWidth, clientX - buttonWidth / 2)
    );
    const newY = Math.max(
      0,
      Math.min(window.innerHeight - buttonHeight, clientY - buttonHeight / 2)
    );

    setButtonPosition({ x: newX, y: newY });
    setIsCustomPosition(true);
    setDefaultPositionClass(undefined);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches && e.touches[0]) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    const edgeThreshold = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = buttonPosition;

    if (x < edgeThreshold) x = 0;
    if (x > viewportWidth - 48 - edgeThreshold) x = viewportWidth - 48;

    if (y < edgeThreshold) y = 0;
    if (y > viewportHeight - 48 - edgeThreshold) y = viewportHeight - 48;

    setButtonPosition({ x, y });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleDragEnd);

      announce("Dragging accessibility button. Release to place.");
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, buttonPosition]);

  useGlobalShortcuts();

  const resetButtonPosition = () => {
    setIsCustomPosition(false);
    setDefaultPositionClass(position);
    setButtonPosition({ x: 0, y: 0 });
    localStorage.removeItem("accessibility-button-position");
    announce("Accessibility button position reset to default");
  };

  return (
    <>
      <Button
        onClick={handleToggle}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        variant="ghost"
        size="icon"
        style={
          isCustomPosition
            ? {
                top: `${buttonPosition.y}px`,
                left: `${buttonPosition.x}px`,
                cursor: isDragging ? "grabbing" : "grab",
              }
            : {}
        }
        className={`
          fixed z-50 bg-primary text-primary-foreground rounded-full w-12 h-12 
          shadow-lg flex items-center justify-center hover:bg-primary/90 hover:scale-110
          transition-colors duration-200 ease-in-out 
          ${isDragging ? "scale-110 shadow-xl" : "animate-pulse-slow"}
          ${
            !isCustomPosition
              ? `
            ${
              defaultPositionClass === "top-left"
                ? "top-4 left-4 sm:top-6 sm:left-6"
                : ""
            }
            ${
              defaultPositionClass === "top-right"
                ? "top-4 right-4 sm:top-6 sm:right-6"
                : ""
            }
            ${
              defaultPositionClass === "bottom-left"
                ? "bottom-5 left-4 sm:bottom-30 sm:left-6"
                : ""
            }
            ${
              defaultPositionClass === "bottom-right"
                ? "bottom-4 right-4 sm:bottom-6 sm:right-6"
                : ""
            }
            ${
              defaultPositionClass === "middle-left"
                ? "top-1/3 -translate-y-1/2 left-4 sm:left-6"
                : ""
            }
            ${
              defaultPositionClass === "middle-right"
                ? "top-1/3 -translate-y-1/2 right-4 sm:right-6"
                : ""
            }
          `
              : ""
          }
        `}
        aria-expanded={isOpen}
        aria-controls="accessibility-settings"
        title="Accessibility Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span className="sr-only">Accessibility Settings</span>
      </Button>

      {isOpen && (
        <div
          id="accessibility-settings"
          className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-title"
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              announce("Accessibility settings panel closed");
            }
          }}
        >
          <div className="bg-background text-foreground w-full max-w-xs h-auto max-h-[100vh] pt-8 pb-6 px-6 shadow-lg border-l border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mt-1 mb-5">
              <h2
                id="accessibility-title"
                className="text-xl font-semibold mt-1"
              >
                Accessibility
              </h2>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Display</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast" className="cursor-pointer">
                      High contrast
                    </Label>
                    <Switch
                      id="high-contrast"
                      checked={highContrast}
                      onCheckedChange={toggleHighContrast}
                    />
                  </div>

                  <div>
                    <Label className="block mb-2">Text size</Label>
                    <TextSizing />
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <h3 className="text-lg font-medium mb-2">Motion</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion" className="cursor-pointer">
                    Reduced motion
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={reducedMotion}
                    onCheckedChange={setReducedMotion}
                  />
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <h3 className="text-lg font-medium mb-2">Navigation</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="focus-visible" className="cursor-pointer">
                    Visible focus indicators
                  </Label>
                  <Switch
                    id="focus-visible"
                    checked={focusVisible}
                    onCheckedChange={setFocusVisible}
                  />
                </div>
              </div>

              <Separator className="my-3" />

              <div className="pt-1">
                <Button
                  variant="secondary"
                  className="w-full mb-3"
                  onClick={() => {
                    setReducedMotion(false);
                    toggleHighContrast();
                    setFocusVisible(true);
                    announce("Accessibility settings reset to defaults");
                  }}
                >
                  Reset to defaults
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetButtonPosition}
                >
                  Reset Button Position
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilitySettings;
