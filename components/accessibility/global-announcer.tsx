"use client";

import React from "react";

/**
 *  announcer component that sets up ARIA live regions
 * for both polite and assertive announcements
 *
 */
export function GlobalAnnouncer() {
  return (
    <div className="sr-only" aria-hidden="false">
      <div
        id="polite-live-region"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      ></div>
      <div
        id="assertive-live-region"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      ></div>
    </div>
  );
}

export default GlobalAnnouncer;
