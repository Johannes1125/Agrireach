"use client";

import React from "react";
import ContactButton from "./ContactButton";
import * as Icons from "lucide-react";
import type { Producer } from "./ProducersList";
// router removed — View profile button was removed per request

function stringToHsl(str: string, s = 65, l = 85) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h} ${s}% ${l}%)`;
}

export default function ProducerCard({
  producer,
  index,
  onViewProfileAction,
}: {
  producer: Producer;
  index?: number;
  onViewProfileAction?: () => void;
}) {
  const bgAlt =
    index !== undefined && index % 2 === 1 ? "bg-primary/5" : "bg-card";
  const accent = stringToHsl(producer.id);
  const initials = producer.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`rounded-lg border ${bgAlt} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{producer.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Icons.MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{producer.location}</span>
            </div>
          </div>
        </div>
        <BookmarkToggle id={producer.id} />
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1">
          <Icons.Star
            className="h-3.5 w-3.5 text-yellow-500"
            aria-hidden="true"
          />
          {producer.rating.toFixed(1)}
        </span>
        <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
          {producer.category}
        </span>
        {producer.featured && (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
            Featured
          </span>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
      </p>

      <div className="flex items-center justify-end">
        <ContactButton producerId={producer.id} producerName={producer.name} />
      </div>
    </div>
  );
}

function BookmarkToggle({ id }: { id: string }) {
  const [saved, setSaved] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("agrireach.bookmarks");
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setSaved(ids.includes(id));
    } catch {}
  }, [id]);

  const toggle = () => {
    try {
      const raw = localStorage.getItem("agrireach.bookmarks");
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      const next = ids.includes(id)
        ? ids.filter((x) => x !== id)
        : [...ids, id];
      localStorage.setItem("agrireach.bookmarks", JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark"}
      className={`inline-flex items-center justify-center rounded-full border p-2 transition ${
        saved
          ? "bg-yellow-50 text-yellow-600 border-yellow-200"
          : "text-muted-foreground hover:bg-accent"
      }`}
    >
      <Icons.Bookmark
        className={`h-4 w-4 ${saved ? "fill-yellow-500" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}
