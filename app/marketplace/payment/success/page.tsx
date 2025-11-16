"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Get pending payment data from sessionStorage FIRST (most reliable for e-wallet payments)
        const pendingPaymentStr = sessionStorage.getItem("pending_payment")
        const pendingPayment = pendingPaymentStr ? JSON.parse(pendingPaymentStr) : null
        
        // Get payment identifiers from URL params (PayMongo might include these)
        const sourceId = searchParams.get("source_id")
        const paymentId = searchParams.get("payment_id")
        const paymentIntentId = searchParams.get("payment_intent_id")
        
        // Build confirmation payload - prioritize sessionStorage, then URL params
        const confirmationPayload: {
          source_id?: string
          payment_id?: string
          payment_intent_id?: string
        } = {}
        
        // For payment_intent_id: prioritize sessionStorage, then URL param (for both card and e-wallet)
        if (pendingPayment?.payment_intent_id) {
          confirmationPayload.payment_intent_id = pendingPayment.payment_intent_id
        } else if (paymentIntentId) {
          confirmationPayload.payment_intent_id = paymentIntentId
        }
        
        // For source_id: use sessionStorage first (legacy support), then URL param
        if (pendingPayment?.source_id) {
          confirmationPayload.source_id = pendingPayment.source_id
        } else if (sourceId) {
          confirmationPayload.source_id = sourceId
        }
        
        // For payment_id: use sessionStorage first, then URL param
        if (pendingPayment?.payment_id) {
          confirmationPayload.payment_id = pendingPayment.payment_id
        } else if (paymentId) {
          confirmationPayload.payment_id = paymentId
        }
        
        // Check if we have at least one identifier
        if (!confirmationPayload.source_id && !confirmationPayload.payment_id && !confirmationPayload.payment_intent_id) {
          setError("No payment identifier found")
          setProcessing(false)
          return
        }
        
        console.log('Confirming payment with payload:', confirmationPayload)
        console.log('URL params:', { sourceId, paymentId, paymentIntentId })
        console.log('SessionStorage:', pendingPayment)
        
        // Confirm payment with backend
        const res = await authFetch("/api/marketplace/checkout/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(confirmationPayload),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Failed to confirm payment")
        }

        const data = await res.json()
        // API returns order_ids array
        setOrderIds(data.order_ids || data.orders || [])
        
        // Clear pending payment
        if (pendingPaymentStr) {
          sessionStorage.removeItem("pending_payment")
        }
        
        toast.success("Payment successful! Your order has been placed.")
      } catch (err: any) {
        console.error("Payment confirmation error:", err)
        setError(err.message || "Failed to confirm payment")
        toast.error(err.message || "Failed to confirm payment")
      } finally {
        setProcessing(false)
      }
    }

    confirmPayment()
  }, [searchParams])

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Processing Payment</h2>
                <p className="text-muted-foreground mt-2">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Package className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Payment Confirmation Failed</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Don't worry! If payment was deducted, please contact support with your transaction details.
            </p>
            <div className="flex gap-2">
              <Link href="/marketplace" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Marketplace
                </Button>
              </Link>
              <Link href="/marketplace" className="flex-1">
                <Button className="w-full">View Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>Your order has been placed successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderIds.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Order Details</p>
              <div className="space-y-1">
                {orderIds.map((orderId, index) => (
                  <div key={orderId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order #{index + 1}</span>
                    <Link href={`/orders/${orderId}`} className="text-primary hover:underline">
                      View Order
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Payment processed successfully</p>
            <p>✓ Order confirmation sent to your email</p>
            <p>✓ Seller has been notified</p>
          </div>

          <div className="space-y-2">
            <Link href="/marketplace">
              <Button className="w-full">
                View My Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Thank you for shopping with AgriReach!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

