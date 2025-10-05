"use client";

import { useEffect, useState } from "react";

interface LiveRegionProps {
  /**
   * The message to be announced by screen readers
   */
  message: string;

  /**
   * The politeness level of the announcement
   * - 'polite': Waits for user idle before announcing (default)
   * - 'assertive': Announces immediately, interrupting current speech
   */
  politeness?: "polite" | "assertive";

  /**
   * Time in milliseconds after which the announcement will be cleared
   * Set to 0 to disable auto-clearing
   */
  clearAfter?: number;

  /**
   * Whether the region should be completely hidden (true) or
   * only visually hidden but still in the DOM (false)
   */
  atomic?: boolean;
}

/**
 * A component that creates an accessible live region for screen reader announcements.
 *
 * @example
 * ```tsx
 * // For normal updates:
 * <LiveRegion message="3 new products were added to the marketplace" />
 *
 * // For important alerts:
 * <LiveRegion message="Your session is about to expire" politeness="assertive" />
 * ```
 */
export function LiveRegion({
  message,
  politeness = "polite",
  clearAfter = 5000,
  atomic = true,
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);

    if (clearAfter > 0 && message) {
      const timer = setTimeout(() => {
        setAnnouncement("");
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!announcement) return null;

  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
      role={politeness === "assertive" ? "alert" : "status"}
    >
      {announcement}
    </div>
  );
}

/**
 * Context provider for global screen reader announcements.
 * To be used in combination with the useAnnounce hook.
 */
export function GlobalAnnouncer() {
  // This will be managed by the useAnnounce hook
  return (
    <>
      <div
        id="polite-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      ></div>
      <div
        id="assertive-live-region"
        aria-live="assertive"
        role="alert"
        aria-atomic="true"
        className="sr-only"
      ></div>
    </>
  );
}
