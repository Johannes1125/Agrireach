"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProducerCard from "./ProducerCard";
import SearchBar from "@/components/producers/SearchBar";
import SavedPanel from "@/components/producers/SavedPanel";
import ProducerModal from "./ProducerModal";

export type Producer = {
  id: string;
  name: string;
  location: string;
  description: string;
  category: string;
  rating: number; // 0-5
  featured?: boolean;
  avatar?: string | null;
  verified?: boolean;
  trustScore?: number;
  userId?: string;
  productsCount?: number;
  reviewsCount?: number;
  services?: string[];
  industry?: string;
  website?: string;
  phone?: string;
};

export default function ProducersList() {
  const [query, setQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [savedOpen, setSavedOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(0);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

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

  const handleViewProfile = (producer: Producer) => {
    setSelectedProducer(producer);
    setModalOpen(true);
  };

  // Fetch producers from API
  useEffect(() => {
    const fetchProducers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (query.trim()) {
          params.append("search", query.trim());
        }
        if (locationFilter && locationFilter !== "all") {
          params.append("location", locationFilter);
        }
        if (categoryFilter && categoryFilter !== "all") {
          params.append("category", categoryFilter);
        }

        const response = await fetch(`/api/producers?${params.toString()}`);
        const data = await response.json();

        if (data.ok && data.data) {
          let items = data.data.items || [];

          // Apply client-side sorting
          items = [...items].sort((a: Producer, b: Producer) => {
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

          setProducers(items);
          setTotal(data.data.total || 0);
          setPages(data.data.pages || 0);

          // Extract unique locations and categories for filters
          const locations = Array.from(new Set(items.map((p: Producer) => p.location))).sort();
          const categories = Array.from(
            new Set([
              ...items.map((p: Producer) => p.category),
              ...items.flatMap((p: Producer) => p.services || []),
            ])
          ).sort();
          setAllLocations(locations);
          setAllCategories(categories);
        }
      } catch (error) {
        console.error("Error fetching producers:", error);
        setProducers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducers();
  }, [page, query, locationFilter, categoryFilter, sortBy]);

  const filtered = useMemo(() => {
    // Additional client-side filtering if needed
    return producers;
  }, [producers]);

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
            {allLocations.map((loc) => (
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
            {allCategories.map((cat) => (
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

      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          Loading producers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          {query || locationFilter !== "all" || categoryFilter !== "all"
            ? `No producers found matching your filters. Try a different search or filter.`
            : "No producers available at the moment."}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProducerCard
                key={p.id}
                producer={p}
                index={i}
                onViewProfileAction={handleViewProfile}
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Producer Modal */}
      <ProducerModal
        producer={selectedProducer}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Saved popup */}
      <SavedPanel
        open={savedOpen}
        onCloseAction={() => setSavedOpen(false)}
        items={producers
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
