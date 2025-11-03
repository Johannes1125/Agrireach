"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProducerCard from "./ProducerCard";
import SearchBar from "@/components/producers/SearchBar";
import SavedPanel from "@/components/producers/SavedPanel";

export type Producer = {
  id: string;
  name: string;
  location: string;
  description: string;
  category: string;
  rating: number; // 0-5
  featured?: boolean;
};

const mockProducers: Producer[] = [
  {
    id: "p1",
    name: "Green Valley Farms",
    location: "Benguet, PH",
    description: "Fresh organic vegetables grown sustainably in the highlands.",
    category: "Vegetables",
    rating: 4.7,
    featured: true,
  },
  {
    id: "p2",
    name: "Sunrise Cacao Co-op",
    location: "Davao, PH",
    description:
      "Smallholder cacao farmers producing premium beans for chocolate.",
    category: "Cacao",
    rating: 4.4,
  },
  {
    id: "p3",
    name: "Island Artisan Collective",
    location: "Cebu, PH",
    description:
      "Handcrafted goods from local artisans and cottage industries.",
    category: "Artisan",
    rating: 4.6,
  },
];

export default function ProducersList() {
  const [query, setQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [savedOpen, setSavedOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const BOOKMARKS_KEY = "agrireach.bookmarks";

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(BOOKMARKS_KEY)
          : null;
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setBookmarks(Array.isArray(list) ? list : []);
    } catch {
      setBookmarks([]);
    }
  }, []);

  const refreshBookmarks = () => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setBookmarks(Array.isArray(list) ? list : []);
    } catch {
      setBookmarks([]);
    }
  };

  const handleUnsave = (id: string) => {
    try {
      const next = bookmarks.filter((b) => b !== id);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      setBookmarks(next);
    } catch {}
  };

  const locations = useMemo(
    () => Array.from(new Set(mockProducers.map((p) => p.location))),
    []
  );
  const categories = useMemo(
    () => Array.from(new Set(mockProducers.map((p) => p.category))),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = mockProducers.filter((p) => {
      const matchText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchLoc =
        locationFilter === "all" || p.location === locationFilter;
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchText && matchLoc && matchCat;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [query, locationFilter, categoryFilter, sortBy]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChangeAction={setQuery}
        placeholder="Search producers, location, or keywords..."
      />

      {/* Filter & sort toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by location"
          >
            <option value="all">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort producers"
          >
            <option value="name">Sort: Name (A–Z)</option>
            <option value="rating-desc">Sort: Rating (high → low)</option>
            <option value="rating-asc">Sort: Rating (low → high)</option>
          </select>

          <button
            type="button"
            onClick={() => {
              refreshBookmarks();
              setSavedOpen(true);
            }}
            aria-label="Open saved companies"
            className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
          >
            {/* bookmark icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-foreground"
            >
              <path
                d="M6 3h12v18l-6-4-6 4V3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Saved
            {bookmarks.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          No producers found matching "{query}". Try a different name or
          location.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <ProducerCard key={p.id} producer={p} index={i} />
          ))}
        </div>
      )}

      {/* Saved popup */}
      <SavedPanel
        open={savedOpen}
        onCloseAction={() => setSavedOpen(false)}
        items={mockProducers
          .filter((p) => bookmarks.includes(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            location: p.location,
            description: p.description,
          }))}
        onUnsaveAction={handleUnsave}
      />
    </div>
  );
}
