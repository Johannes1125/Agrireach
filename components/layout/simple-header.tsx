"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getRoleDisplay } from "@/lib/role-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { Settings, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authFetch, logout } from "@/lib/auth-client"

interface SimpleHeaderProps {
  user?: {
    id: string
    name: string
    email: string
    role: "worker" | "recruiter" | "buyer" | "admin"
    avatar: string
    location: string
  }
}

export function SimpleHeader({ user }: SimpleHeaderProps) {
  const { user: authUser, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<SimpleHeaderProps["user"] | undefined>(undefined)

  // Check if we're on auth pages or landing page early to avoid unnecessary API calls
  const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/admin/login')
  const isLandingPage = pathname === '/'

  useEffect(() => {
    // Skip auth check if on landing page or auth pages to avoid unnecessary API calls
    if (isAuthPage || isLandingPage) {
      return
    }

    let mounted = true
    const load = async () => {
      try {
        const res = await authFetch("/api/auth/me")
        if (!res.ok) return
        const json = await res.json()
        const u = json?.user || json?.data?.user
        if (u && mounted) {
          setMe({
            id: u._id || u.id,
            name: u.full_name || u.name || "",
            email: u.email || "",
            role: (u.role || "worker") as "worker" | "recruiter" | "buyer" | "admin",
            avatar: u.avatar_url || u.avatar || "",
            location: u.location || "",
          })
        }
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [isAuthPage, isLandingPage])

  // Hide header on auth pages and landing page
  if (isAuthPage || isLandingPage) {
    return null
  }

  const currentUser = user || me || (authUser
    ? {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role as "worker" | "recruiter" | "buyer" | "admin",
        avatar: authUser.avatar || "",
        location: authUser.location || "",
      }
    : undefined)

  const getRoleBadge = (role: string) => {
    const label = getRoleDisplay(role)
    if (!label) return null
    if (role === "buyer") return (
      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors text-xs font-medium px-2.5 py-0.5">
        {label}
      </Badge>
    )
    if (role === "admin") return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 transition-colors text-xs font-medium px-2.5 py-0.5">
        {label}
      </Badge>
    )
    if (role === "recruiter") return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 transition-colors text-xs font-medium px-2.5 py-0.5">
        {label}
      </Badge>
    )
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 transition-colors text-xs font-medium px-2.5 py-0.5">
        {label}
      </Badge>
    )
  }

  // If not authenticated and not loading, show a minimal header with Sign In
  if (!currentUser && !loading) {
    return (
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-end pr-4 lg:pr-6">
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter />
            <Link href="/auth/login">
              <Button variant="outline" className="bg-transparent">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-end pr-4 lg:pr-6">
        {/* User Actions - Right Side Only */}
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200 hover:scale-105">
                  <AvatarImage src={(currentUser?.avatar || "/placeholder.svg")} alt={(currentUser?.name || "User")} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
                    {(currentUser?.name
                      ? currentUser.name.split(" ").map((n) => n[0]).join("")
                      : "U")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border-border/50">
              <DropdownMenuLabel className="px-3 py-3 pb-3">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={(currentUser?.avatar || "/placeholder.svg")} alt={(currentUser?.name || "User")} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(currentUser?.name
                          ? currentUser.name.split(" ").map((n) => n[0]).join("")
                          : "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate text-foreground">
                        {currentUser?.name || "User"}
                      </p>
                      <p className="text-xs leading-tight truncate text-muted-foreground mt-0.5">
                        {currentUser?.email || ""}
                      </p>
                    </div>
                  </div>
                  {currentUser?.role && (
                    <div className="pt-1">
                      {getRoleBadge(currentUser.role)}
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 transition-colors focus:bg-accent">
                <Link href="/profile" className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 transition-colors focus:bg-accent">
                <Link href="/settings" className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="cursor-pointer rounded-md px-3 py-2.5 transition-colors focus:bg-destructive/10 text-destructive focus:text-destructive"
                onClick={async () => {
                  await logout()
                  router.push("/auth/login")
                  router.refresh()
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10 text-destructive">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Sign Out</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
