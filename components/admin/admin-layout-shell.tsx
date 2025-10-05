"use client"

import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"

  return (
    <div className="min-h-screen bg-background">
      {!isLogin && <AdminSidebar />}
      <div className={!isLogin ? "lg:pl-64" : ""}>{children}</div>
    </div>
  )
}


