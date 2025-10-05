import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccessibility } from "@/components/accessibility/accessibility-provider";
import { ShortcutDefinition } from "@/components/accessibility/keyboard-shortcuts";

// A hook that defines global keyboard shortcuts for AgriReach
export function useGlobalShortcuts() {
  const router = useRouter();
  const { announce } = useAccessibility();

  useEffect(() => {
    const shortcuts: ShortcutDefinition[] = [
      // Navigation shortcuts
      {
        key: "h",
        altKey: true,
        description: "Go to home page",
        action: () => {
          router.push("/");
          announce("Navigated to home page");
        },
      },
      {
        key: "m",
        altKey: true,
        description: "Go to marketplace",
        action: () => {
          router.push("/marketplace");
          announce("Navigated to marketplace");
        },
      },
      {
        key: "c",
        altKey: true,
        description: "Go to community",
        action: () => {
          router.push("/community");
          announce("Navigated to community");
        },
      },
      {
        key: "o",
        altKey: true,
        description: "Go to opportunities",
        action: () => {
          router.push("/opportunities");
          announce("Navigated to opportunities");
        },
      },
      {
        key: "p",
        altKey: true,
        description: "Go to profile",
        action: () => {
          router.push("/profile");
          announce("Navigated to profile");
        },
      },
      {
        key: "s",
        altKey: true,
        description: "Go to settings",
        action: () => {
          router.push("/settings");
          announce("Navigated to settings");
        },
      },
      {
        key: "a",
        altKey: true,
        description: "Go to accessibility settings",
        action: () => {
          router.push("/accessibility");
          announce("Navigated to accessibility settings");
        },
      },

      // Focus management shortcuts
      {
        key: "/",
        ctrlKey: true,
        description: "Focus search",
        action: () => {
          const searchInput = document.querySelector(
            '[role="search"] input'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            announce("Search focused");
          }
        },
      },
      {
        key: "Escape",
        description: "Close popups or modals",
        action: () => {
          // This will be handled by components that listen for Escape key
        },
      },

      // Special actions
      {
        key: "?",
        description: "Show keyboard shortcuts",
        action: () => {
          // This will be handled by the KeyboardShortcuts component
        },
      },
      {
        key: "t",
        altKey: true,
        description: "Toggle theme",
        action: () => {
          const html = document.documentElement;
          const currentTheme = html.classList.contains("dark")
            ? "dark"
            : "light";
          const newTheme = currentTheme === "dark" ? "light" : "dark";

          html.classList.remove(currentTheme);
          html.classList.add(newTheme);

          localStorage.setItem("theme", newTheme);
          announce(`Theme changed to ${newTheme} mode`);
        },
      },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, etc.
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName
        ) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Process shortcut
      for (const shortcut of shortcuts) {
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!e.ctrlKey === !!shortcut.ctrlKey &&
          !!e.altKey === !!shortcut.altKey &&
          !!e.shiftKey === !!shortcut.shiftKey
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, announce]);

  return null;
}

export default useGlobalShortcuts;
