"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Plus } from "lucide-react"
import Link from "next/link"

interface SubscriptionStatusCardProps {
  currentPlan?: "free" | "pro"
  className?: string
}

export function SubscriptionStatusCard({ 
  currentPlan = "free",
  className = "" 
}: SubscriptionStatusCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-heading text-2xl">
              {currentPlan === "pro" ? "Pro Plan" : "Free Plan"}
            </CardTitle>
            <Badge 
              variant={currentPlan === "pro" ? "default" : "secondary"}
              className="capitalize"
            >
              {currentPlan === "pro" ? "Active" : "Active"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {currentPlan === "pro" 
            ? "You're currently on the Pro plan with all premium features unlocked."
            : "You're currently on the free plan with basic features. Upgrade to unlock premium features."}
        </CardDescription>
      </CardHeader>
      {currentPlan === "free" && (
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/pricing">
              <Plus className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Link>
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

