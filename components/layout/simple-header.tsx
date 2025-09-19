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
  // Mock user data if not provided
  const currentUser = user || {
    id: "1",
    name: "John Farmer",
    email: "john@example.com",
    role: "worker" as const,
    avatar: "/farmer-avatar.png",
    location: "Rural Valley, CA",
  }

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-end px-4 w-full">
        {/* User Actions - Right Side Only */}
        <div className="flex items-center gap-4">
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback>
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
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
