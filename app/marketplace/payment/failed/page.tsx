"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PaymentFailedPage() {
  const router = useRouter()

  useEffect(() => {
    // Payment failed, but we keep the pending payment in sessionStorage
    // so user can try again if they want
  }, [])

  const handleTryAgain = () => {
    router.push("/marketplace")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Payment Failed</CardTitle>
          <CardDescription>Your payment could not be processed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Possible reasons:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Insufficient funds in your account</li>
              <li>Payment was cancelled</li>
              <li>Network connection issue</li>
              <li>Invalid payment details</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• No charges have been made to your account</p>
            <p>• Your cart items are still saved</p>
            <p>• You can try again at any time</p>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={handleTryAgain}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

