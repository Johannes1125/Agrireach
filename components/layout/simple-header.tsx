"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-client"

interface SimpleHeaderProps {
  user?: {
    id: string
    name: string
    email: string
    role: "worker" | "recruiter" | "buyer"
    avatar: string
    location: string
  }
}

export function SimpleHeader({ user }: SimpleHeaderProps) {
  const { user: authUser, loading } = useAuth()
  const [me, setMe] = useState<SimpleHeaderProps["user"] | undefined>(undefined)

  useEffect(() => {
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
            role: (u.role || "worker") as any,
            avatar: u.avatar_url || u.avatar || "",
            location: u.location || "",
          })
        }
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [])

  const currentUser = user || me || (authUser
    ? {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role as "worker" | "recruiter" | "buyer",
        avatar: authUser.avatar || "",
        location: authUser.location || "",
      }
    : undefined)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "worker":
        return <Badge variant="secondary">Rural Worker</Badge>
      case "recruiter":
        return <Badge variant="outline">Recruiter</Badge>
      case "buyer":
        return <Badge className="bg-accent text-accent-foreground">Buyer</Badge>
      default:
        return null
    }
  }

  // If not authenticated and not loading, show a minimal header with Sign In
  if (!currentUser && !loading) {
    return (
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-end px-4 lg:px-4">
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
      <div className="container flex h-16 items-center justify-end px-4 lg:px-4">
        {/* User Actions - Right Side Only */}
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(currentUser?.avatar || "/placeholder.svg")} alt={(currentUser?.name || "User")} />
                  <AvatarFallback>
                    {(currentUser?.name
                      ? currentUser.name.split(" ").map((n) => n[0]).join("")
                      : "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{currentUser?.name || ""}</span>
                  {currentUser?.role ? getRoleBadge(currentUser.role) : null}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
