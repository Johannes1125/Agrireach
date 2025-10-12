"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react"
import { OTPVerificationModal } from "@/components/auth/otp-verification-modal"
import { toast } from "sonner"
import { login as loginClient } from "@/lib/auth-client"
import { getGoogleIdToken } from "@/lib/google"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [userFullName, setUserFullName] = useState("")
  const [userRole, setUserRole] = useState("worker")

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }
    return errors
  }

  const validateName = (name: string): string[] => {
    const errors: string[] = []
    if (!name.trim()) {
      errors.push("Name is required")
    }
    if (/[0-9]/.test(name)) {
      errors.push("Name cannot contain numbers")
    }
    return errors
  }

  const validateEmail = (email: string): string[] => {
    const errors: string[] = []
    if (!email.trim()) {
      errors.push("Email is required")
    }
    if (!email.includes("@")) {
      errors.push("Email must contain @ symbol")
    }
    if (!email.includes(".com")) {
      errors.push("Email must include .com")
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) return
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = (formData.get("firstName") as string) || ""
    const lastName = (formData.get("lastName") as string) || ""
    const userType = (formData.get("userType") as string) || "worker"
    const name = [firstName, lastName].filter(Boolean).join(" ")
    const role = userType

    // Validate all fields before proceeding
    const emailErrors = validateEmail(email)
    if (emailErrors.length > 0) {
      toast.error(emailErrors[0])
      setIsLoading(false)
      return
    }

    const nameErrors = validateName(name)
    if (nameErrors.length > 0) {
      toast.error(nameErrors[0])
      setIsLoading(false)
      return
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      toast.error(passwordErrors[0])
      setIsLoading(false)
      return
    }

    setUserEmail(email)
    setUserPassword(password)
    setUserFullName(name)
    setUserRole(role)

    try {
      const vres = await fetch("/api/auth/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, type: "registration" }),
      })
      const vjson = await vres.json().catch(() => ({}))
      if (!vres.ok) throw new Error(vjson?.message || "Failed to send verification code")
      setShowOTPModal(true)
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerified = () => {
    setShowOTPModal(false)
    if (userEmail && userPassword) {
      loginClient(userEmail, userPassword).then((resp) => {
        if (!resp.success) toast.error(resp.message || "Login failed")
        window.location.href = "/dashboard"
      })
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium bg-card hover:bg-accent/50 border-border/50 transition-all duration-200"
            disabled={isLoading}
            onClick={async () => {
              try {
                const idToken = await getGoogleIdToken()
                const res = await fetch("/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idToken }),
                })
                const json = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(json?.message || "Google sign-up failed")
                window.location.href = "/dashboard"
              } catch (e: any) {
                toast.error(e?.message || "Google sign-up failed")
              }
            }}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium bg-card hover:bg-accent/50 border-border/50 transition-all duration-200"
            disabled={isLoading}
          >
            <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Sign up with Facebook
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">Or create account with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First name"
                  className="pl-10 h-12 bg-input border-border/50 focus:border-primary/50 transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Last name"
                className="h-12 bg-input border-border/50 focus:border-primary/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                className="pl-10 h-12 bg-input border-border/50 focus:border-primary/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType" className="text-sm font-medium text-foreground">
              I am a...
            </Label>
            <Select name="userType" required>
              <SelectTrigger className="h-12 bg-input border-border/50 focus:border-primary/50 transition-colors">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Rural Worker (Farmer, Fisher, Artisan)</SelectItem>
                <SelectItem value="recruiter">Recruiter/Employer</SelectItem>
                <SelectItem value="buyer">Buyer/Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Button variant="link" className="px-0 text-sm text-primary h-auto font-medium">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="px-0 text-sm text-primary h-auto font-medium">
                Privacy Policy
              </Button>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-sm font-medium gradient-primary hover:opacity-90 transition-opacity"
            disabled={isLoading || !agreedToTerms}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create your account"
            )}
          </Button>
        </form>
      </div>

      <OTPVerificationModal
        open={showOTPModal}
        onOpenChange={setShowOTPModal}
        email={userEmail}
        onVerified={handleOTPVerified}
        onConfirm={async (code: string) => {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, password: userPassword, name: userFullName, role: userRole, token: code }),
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(json?.message || "Verification failed")
        }}
      />
    </>
  )
}
