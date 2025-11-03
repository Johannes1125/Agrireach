"use client";

import React from "react";
import Trans from "../ui/trans";
import ProducersList from "./ProducersList";
import * as Icons from "lucide-react";

export default function ProducersPageClient() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icons.Users className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            <Trans text="Producers" />
          </h1>
          <p className="text-muted-foreground">
            <Trans text="Discover local farmers and artisans you can collaborate with." />
          </p>
        </div>
      </header>

      <ProducersList />
    </div>
  );
}
