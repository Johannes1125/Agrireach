'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, RefreshCw, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentError {
  error: string
  message: string
  payment_id?: string
  amount?: number
  currency?: string
}

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null)
  const [loading, setLoading] = useState(true)

  const paymentId = searchParams.get('payment_id')
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  useEffect(() => {
    // Set error information from URL parameters
    if (error || message || paymentId) {
      setPaymentError({
        error: error || 'Payment failed',
        message: message || 'Your payment could not be processed. Please try again.',
        payment_id: paymentId || undefined
      })
    }
    setLoading(false)
  }, [error, message, paymentId])

  const retryPayment = () => {
    if (paymentId) {
      // Redirect to checkout with the same payment ID
      router.push(`/marketplace/checkout?retry=${paymentId}`)
    } else {
      // Go back to marketplace
      router.push('/marketplace')
    }
  }

  const getErrorMessage = () => {
    if (!paymentError) return 'Payment failed'
    
    switch (paymentError.error) {
      case 'insufficient_funds':
        return 'Insufficient funds in your account'
      case 'card_declined':
        return 'Your card was declined by the bank'
      case 'expired_card':
        return 'Your card has expired'
      case 'invalid_card':
        return 'Invalid card details provided'
      case 'network_error':
        return 'Network error occurred during payment'
      case 'cancelled':
        return 'Payment was cancelled'
      default:
        return paymentError.message || 'Payment could not be processed'
    }
  }

  const getErrorDescription = () => {
    if (!paymentError) return 'Please try again or contact support if the problem persists.'
    
    switch (paymentError.error) {
      case 'insufficient_funds':
        return 'Please check your account balance or try a different payment method.'
      case 'card_declined':
        return 'Please contact your bank or try a different card.'
      case 'expired_card':
        return 'Please update your card details or use a different card.'
      case 'invalid_card':
        return 'Please check your card details and try again.'
      case 'network_error':
        return 'Please check your internet connection and try again.'
      case 'cancelled':
        return 'You can try again anytime or contact support if you need assistance.'
      default:
        return 'Please try again or contact support if the problem persists.'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
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
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-red-600">
            Payment Failed
          </CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {getErrorDescription()}
          </div>

          {paymentError && (
            <>
              {paymentError.payment_id && (
                <div className="text-sm">
                  <span className="font-medium">Payment ID:</span> {paymentError.payment_id}
                </div>
              )}
              
              {paymentError.amount && (
                <div className="text-sm">
                  <span className="font-medium">Amount:</span> ₱{paymentError.amount.toFixed(2)} {paymentError.currency}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={retryPayment}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/marketplace')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </div>

          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Need help?</strong> If you continue to experience issues, 
              please contact our support team with your payment ID for assistance.
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Supported payment methods: GCash, GrabPay, Credit/Debit Cards
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}