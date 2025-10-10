"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { FullScreenLoading } from "@/components/ui/loading-overlay"

interface LoadingContextType {
  loading: boolean
  loadingText: string
  setLoading: (loading: boolean, text?: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoadingState] = useState(false)
  const [loadingText, setLoadingText] = useState("Loading...")

  const setLoading = (isLoading: boolean, text: string = "Loading...") => {
    setLoadingState(isLoading)
    setLoadingText(text)
  }

  return (
    <LoadingContext.Provider value={{ loading, loadingText, setLoading }}>
      {children}
      <FullScreenLoading loading={loading} text={loadingText} />
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

