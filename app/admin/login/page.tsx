import Link from "next/link"
import { AdminLoginForm } from "@/components/auth/admin-login-form"
import { Shield } from "lucide-react"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">Secure access for administrators only</p>
            </div>
          </div>

          {/* Login Form */}
          <AdminLoginForm />

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Not an admin?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Go to user login
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">This is a secure area. All access attempts are logged.</p>
        </div>
      </div>
    </div>
  )
}
