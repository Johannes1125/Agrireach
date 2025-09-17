import type React from "react"
import { AppSidebar } from "./app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">{children}</main>
    </div>
  )
}
