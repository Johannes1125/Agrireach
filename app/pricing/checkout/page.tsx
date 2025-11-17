"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PricingCheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/pricing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Pro Plan Checkout</CardTitle>
              <CardDescription>
                Complete your upgrade to Pro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold">Pro Plan</p>
                  <p className="text-sm text-muted-foreground mt-2">₱2,750 /month</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Payment integration will be implemented here. This is a frontend-only placeholder.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

