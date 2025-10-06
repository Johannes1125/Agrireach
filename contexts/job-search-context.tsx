"use client";

import { createContext, useState, useContext, ReactNode } from "react";

interface JobSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  location: string;
  setLocation: (location: string) => void;
}

const JobSearchContext = createContext<JobSearchContextType | undefined>(
  undefined
);

export function JobSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  return (
    <JobSearchContext.Provider
      value={{ searchQuery, setSearchQuery, location, setLocation }}
    >
      {children}
    </JobSearchContext.Provider>
  );
}

export function useJobSearch() {
  const context = useContext(JobSearchContext);
  if (context === undefined) {
    throw new Error("useJobSearch must be used within a JobSearchProvider");
  }
  return context;
}
