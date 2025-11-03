"use client";

import React from "react";
import * as Icons from "lucide-react";

export default function SearchBar({
  value,
  onChangeAction,
  placeholder = "Search...",
}: {
  value: string;
  onChangeAction: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icons.Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <input
          value={value}
          onChange={(e) => onChangeAction(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border px-10 py-2 text-sm shadow-sm focus:ring-1 focus:ring-primary"
          aria-label={placeholder}
        />
      </div>
      <button
        type="button"
        onClick={() => onChangeAction("")}
        aria-label="Clear search"
        className="inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm hover:bg-accent"
      >
        <Icons.X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
