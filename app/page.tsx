import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sprout, Users, MapPin, TrendingUp, Shield, Globe } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div>
      {/* Navigation */}
      <nav className="sticky top-0 z-100 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-primary">AgriReach</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 text-sm font-medium">
            Supporting UN Sustainable Development Goals
          </Badge>
          <h1 className="font-heading text-4xl font-black leading-tight text-balance md:text-6xl lg:text-7xl">
            Connecting Rural Workers with <span className="text-primary">Opportunities</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Empowering farmers, fishers, and artisans to build sustainable livelihoods while preserving traditional
            skills and boosting rural economies.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
                Join AgriReach Today
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-3 bg-transparent">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-balance md:text-4xl">Empowering Rural Communities</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how AgriReach connects traditional skills with modern opportunities
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Smart Matching</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Connect workers with opportunities based on skills, location, and seasonal demand patterns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Local Marketplace</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Direct sales platform for farmers, fishers, and artisans to reach buyers without intermediaries.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Community Forums</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Share knowledge, discuss best practices, and build connections within rural communities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Trust & Safety</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Rating system and verification process ensure reliable connections and fair transactions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Skill Recognition</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Earn badges and build reputation for traditional and modern agricultural skills.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Sprout className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-heading text-xl">Sustainable Impact</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Track your contribution to sustainable development goals and rural economic growth.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card py-16">
        <div className="px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-3xl font-bold text-balance md:text-4xl">
              Ready to Transform Rural Livelihoods?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands of rural workers, businesses, and buyers creating sustainable opportunities together.
            </p>
            <div className="mt-8">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-6">
        <div className="px-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold text-primary">AgriReach</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 AgriReach. Empowering rural communities worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
