"use client";

import React from "react";
import ProducersList from "./ProducersList";
import * as Icons from "lucide-react";

export default function ProducersPageClient() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-extrabold">Producers</h1>
          <p className="text-lg text-muted-foreground">
            Discover local farmers and artisans you can collaborate with.
          </p>
        </div>
      </header>

      <ProducersList />
    </div>
  );
}
