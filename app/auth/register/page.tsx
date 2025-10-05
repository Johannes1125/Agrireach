import { RegisterForm } from "@/components/auth/register-form"
import { Sprout, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and messaging */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <span className="font-heading text-3xl font-bold text-foreground">AgriReach</span>
            </Link>

            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-bold text-balance leading-tight">
                Join thousands of rural professionals
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Create your account to access opportunities, connect with buyers, and grow your agricultural business in
                a thriving community.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Access to verified job opportunities</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Sell products directly to buyers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Build your professional reputation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Connect with like-minded professionals</span>
            </div>
          </div>
        </div>

        {/* Right side - Register form */}
        <div className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sprout className="h-6 w-6 text-primary" />
                </div>
                <span className="font-heading text-2xl font-bold text-primary">AgriReach</span>
              </Link>
            </div>

            {/* Form card */}
            <div className="glass rounded-2xl p-8 shadow-xl border">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="font-heading text-2xl font-bold">Create your account</h2>
                  <p className="text-muted-foreground">Join the agricultural community today</p>
                </div>

                <RegisterForm />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Back to home */}
            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
