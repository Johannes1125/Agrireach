"use client";

import { useCallback } from "react";

/**
 * A hook for making screen reader announcements using ARIA live regions.
 * This hook uses the global live regions defined in the GlobalAnnouncer component.
 *
 * @example
 * ```tsx
 * const announce = useAnnounce();
 *
 * // Polite announcement (default)
 * announce("3 new products were added to the marketplace");
 *
 * // Assertive announcement for important information
 * announce("Your session is about to expire", "assertive");
 * ```
 */
export function useAnnounce() {
  const announce = useCallback(
    (message: string, politeness: "polite" | "assertive" = "polite") => {
      const targetId =
        politeness === "assertive"
          ? "assertive-live-region"
          : "polite-live-region";

      const liveRegion = document.getElementById(targetId);

      if (liveRegion) {
        // Clear and update to ensure announcement even if message text hasn't changed
        liveRegion.textContent = "";

        // Use setTimeout to ensure DOM update and announcement
        setTimeout(() => {
          liveRegion.textContent = message;
        }, 10);
      } else {
        console.warn(
          `Live region with ID "${targetId}" not found. ` +
            `Make sure to include <GlobalAnnouncer /> in your app layout.`
        );
      }
    },
    []
  );

  return announce;
}

/**
 * A hook for keyboard shortcut management.
 * Provides a way to register and handle keyboard shortcuts.
 *
 * @example
 * ```tsx
 * const { registerShortcut } = useKeyboardShortcuts();
 *
 * useEffect(() => {
 *   const unregister = registerShortcut({
 *     key: 'h',
 *     alt: true,
 *     callback: () => navigate('/home'),
 *     description: 'Go to home page'
 *   });
 *
 *   return unregister;
 * }, [registerShortcut]);
 * ```
 */
export function useKeyboardShortcuts() {
  // This will be implemented in a future update
  const registerShortcut = useCallback(() => {
    return () => {}; // Unregister function placeholder
  }, []);

  return { registerShortcut };
}
