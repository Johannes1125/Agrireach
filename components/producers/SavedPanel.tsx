"use client";

import React from "react";

export type SavedItem = {
  id: string;
  name: string;
  location?: string;
  description?: string;
};

export default function SavedPanel({
  open,
  onCloseAction,
  items,
  onUnsaveAction,
}: {
  open: boolean;
  onCloseAction: () => void;
  items: SavedItem[];
  onUnsaveAction: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCloseAction}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saved companies"
        className="absolute right-6 top-6 w-[28rem] max-w-[95vw] overflow-hidden rounded-xl bg-card text-card-foreground shadow-xl ring-1 ring-border"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">Saved companies</h3>
          <button
            onClick={onCloseAction}
            aria-label="Close saved"
            className="rounded p-1 text-muted-foreground hover:bg-accent"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              You haven't saved any companies yet.
            </div>
          ) : (
            items.map((p) => (
              <div key={p.id} className="rounded-md border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.location && (
                      <div className="text-xs text-muted-foreground">
                        {p.location}
                      </div>
                    )}
                    {p.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onUnsaveAction(p.id)}
                    className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Unsave
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
