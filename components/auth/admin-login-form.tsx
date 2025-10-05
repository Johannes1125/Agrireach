"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck } from "lucide-react"

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Implement admin authentication logic
    // For now, simulate login and redirect to admin dashboard
    setTimeout(() => {
      setIsLoading(false)
      router.push("/admin")
    }, 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="admin-email" className="text-sm font-medium text-foreground">
          Admin Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@agrireach.com"
            className="pl-10 h-12 bg-input border-border/50 focus:border-primary/50 transition-colors"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password" className="text-sm font-medium text-foreground">
          Admin Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter admin password"
            className="pl-10 pr-10 h-12 bg-input border-border/50 focus:border-primary/50 transition-colors"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Sign in as Admin
          </>
        )}
      </Button>

      <div className="bg-muted/50 border border-border/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground text-center">
          <Lock className="inline h-3 w-3 mr-1" />
          Two-factor authentication required for admin access
        </p>
      </div>
    </form>
  )
}
