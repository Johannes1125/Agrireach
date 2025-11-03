"use client";

import React, { useMemo, useState } from "react";
import ProducerCard from "./ProducerCard";
import SearchBar from "@/components/producers/SearchBar";

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

        <div>
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
    </div>
  );
}
