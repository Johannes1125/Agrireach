import { LoginForm } from "@/components/auth/login-form"
import { Sprout, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
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
                Welcome back to your agricultural network
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Connect with opportunities, grow your network, and build sustainable livelihoods in rural communities.
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Smart job matching for agricultural workers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Direct marketplace for rural products</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Community forums and knowledge sharing</span>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
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
                  <h2 className="font-heading text-2xl font-bold">Sign in to your account</h2>
                  <p className="text-muted-foreground">Enter your credentials to access your dashboard</p>
                </div>

                <LoginForm />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/register"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Create one here
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Back to home removed per request */}
          </div>
        </div>
      </div>
    </div>
  )
}
