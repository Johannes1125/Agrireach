"use client";

import React from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";

export default function ContactButton({
  producerId,
  producerName,
}: {
  producerId: string;
  producerName: string;
}) {
  const router = useRouter();

  const onContact = async () => {
    try {
      // Redirect to messages/chat tab (original behavior)
      router.push("/chat");
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
