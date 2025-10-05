"use client";

import { useEffect, useState } from "react";

export type ShortcutDefinition = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
  scope?: "global" | "page" | string;
};

export type ShortcutsProviderProps = {
  shortcuts: ShortcutDefinition[];
  children: React.ReactNode;
};

export const KeyboardShortcuts: React.FC<ShortcutsProviderProps> = ({
  shortcuts,
  children,
}) => {
  const [activeShortcuts, setActiveShortcuts] =
    useState<ShortcutDefinition[]>(shortcuts);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setIsHelpVisible(!isHelpVisible);
        return;
      }

      if (isHelpVisible && event.key !== "Tab") {
        event.preventDefault();
        setIsHelpVisible(false);
        return;
      }

      for (const shortcut of activeShortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.addEventListener("keydown", handleKeyDown);
    };
  }, [activeShortcuts, isHelpVisible]);

  useEffect(() => {
    setActiveShortcuts(shortcuts);
  }, [shortcuts]);

  return (
    <>
      {children}

      {}
      {isHelpVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 id="shortcuts-title" className="text-2xl font-bold mb-4">
              Keyboard Shortcuts
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Press any key to close this dialog. Press ? anytime to reopen it.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeShortcuts.map((shortcut, idx) => {
                const keyCombo = [
                  shortcut.ctrlKey && "Ctrl",
                  shortcut.altKey && "Alt",
                  shortcut.shiftKey && "Shift",
                  shortcut.key.toUpperCase(),
                ]
                  .filter(Boolean)
                  .join(" + ");

                return (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                      {keyCombo}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  return <KeyboardShortcuts shortcuts={shortcuts}>{null}</KeyboardShortcuts>;
}
