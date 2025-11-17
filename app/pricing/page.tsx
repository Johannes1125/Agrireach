"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Crown, Sparkles, Zap, Cloud, TrendingUp, Shield, BookOpen, Eye, Users } from "lucide-react"
import Link from "next/link"

const PRO_BENEFITS = [
  {
    icon: Sparkles,
    title: "Early Access to New AI Tools",
    description: "Be among the first to access cutting-edge AI features and tools"
  },
  {
    icon: Zap,
    title: "Priority Support",
    description: "Get faster response times and dedicated support from our team"
  },
  {
    icon: Cloud,
    title: "Expanded Cloud Storage",
    description: "More storage space for your files, documents, and media"
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Profile Boosting",
    description: "Enhance your profile visibility with AI-driven optimization"
  },
  {
    icon: Eye,
    title: "Advanced Job Matching Insights",
    description: "Get detailed analytics and insights for better job matching"
  },
  {
    icon: Shield,
    title: "Verified Pro Badge",
    description: "Showcase your professional status with a verified badge"
  },
  {
    icon: BookOpen,
    title: "Exclusive Training Materials",
    description: "Access premium training resources and educational content"
  },
  {
    icon: TrendingUp,
    title: "Priority Visibility in Listings",
    description: "Your listings appear first in search results and recommendations"
  },
  {
    icon: Users,
    title: "Team/Enterprise Account",
    description: "Manage multiple users and collaborate with your team"
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Crown className="mr-2 h-3 w-3" />
              Premium Plan
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold">
              Upgrade to Pro
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock powerful features and take your AgriReach experience to the next level
            </p>
          </div>

          {/* Pro Plan Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle className="font-heading text-3xl">Pro Plan</CardTitle>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">₱</span>
                  <span className="text-5xl font-bold">2,750</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <CardDescription className="text-base">
                  Billed monthly • Cancel anytime
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Benefits List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">What's Included:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRO_BENEFITS.map((benefit, index) => {
                    const Icon = benefit.icon
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="mt-0.5">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-sm">{benefit.title}</h4>
                          <p className="text-xs text-muted-foreground">{benefit.description}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-6 border-t">
                <Button
                  size="lg"
                  className="w-full text-lg h-12"
                  asChild
                >
                  <Link href="/pricing/checkout">
                    Upgrade to Pro
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Secure payment • 30-day money-back guarantee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Flexible Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pay monthly with the option to cancel anytime. No long-term commitments required.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instant Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get immediate access to all Pro features as soon as you upgrade.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Money-Back Guarantee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Not satisfied? Get a full refund within 30 days of your purchase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

