import type React from "react"
import { AppSidebar } from "./app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <AppSidebar />
      <main className="flex-1 lg:ml-4 min-h-screen w-full">{children}</main>
    </div>
  )
}
