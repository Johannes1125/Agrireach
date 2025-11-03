"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ContactButton from "./ContactButton";
import * as Icons from "lucide-react";

export default function ProducerProfileClient({ id }: { id: string }) {
  // Minimal placeholder. Replace with a real data fetch when API is available.
  const mock = {
    id,
    name: `Producer ${id}`,
    location: "Unknown",
    description: "Profile details are not yet implemented for this producer.",
  };

  const router = useRouter();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent"
        >
          <Icons.ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icons.Users className="h-6 w-6" aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{mock.name}</h1>
          <p className="text-muted-foreground">{mock.location}</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <p className="text-sm text-muted-foreground">
          </p>
        </div>

        <aside className="space-y-4">
          <ContactButton producerId={mock.id} producerName={mock.name} />
        </aside>
      </div>
    </div>
  );
}
