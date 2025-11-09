"use client";

import React from "react";
import * as Icons from "lucide-react";

export default function ContactButton({
  producerId,
  producerName,
}: {
  producerId: string;
  producerName: string;
}) {
  const onContact = async () => {
    try {
      // Chat is now handled by the chat widget
      // User can open the widget using the floating button
      // Scroll to top to make the widget button visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Failed to start contact thread", err);
    }
  };

  return (
    <button
      type="button"
      onClick={onContact}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
      aria-label={`Contact ${producerName}`}
    >
      <Icons.MessageSquare className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
