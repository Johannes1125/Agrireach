"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: "worker" | "recruiter" | "buyer"
  avatar: string
  location: string
}

interface SettingsHeaderProps {
  user: User
}

export function SettingsHeader({ user }: SettingsHeaderProps) {
  return (
    <div className="bg-card border-b">
      <div className="container px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name
                      ? user.name.split(" ").map((n) => n[0]).join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <h1 className="font-heading text-2xl font-bold">Account Settings</h1>
                  </div>
                  <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/profile">View Profile</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
