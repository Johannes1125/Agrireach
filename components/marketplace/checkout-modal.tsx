"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-client"
import { 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from "lucide-react"

interface CartItem {
  _id: string
  product_id: {
    _id: string
    title: string
    price: number
    unit: string
    images?: any
    seller_id: {
      full_name: string
      location: string
    }
  }
  quantity: number
}

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  cartItems: CartItem[]
  onSuccess: () => void
}

export function CheckoutModal({ open, onClose, cartItems, onSuccess }: CheckoutModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(cartItems.map(item => item._id))
  )
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gcash" | "grab_pay" | "paymaya">("gcash")
  const [billingName, setBillingName] = useState("")
  const [billingEmail, setBillingEmail] = useState("")
  const [billingPhone, setBillingPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"select" | "details" | "payment">("select")

  const selectedCartItems = cartItems.filter(item => selectedItems.has(item._id))
  
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.product_id.price * item.quantity,
    0
  )
  const deliveryFee = 50 // Fixed delivery fee
  const total = subtotal + deliveryFee

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    setSelectedItems(new Set(cartItems.map(item => item._id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const handleContinue = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item")
      return
    }
    setStep("details")
  }

  const handleProceedToPayment = () => {
    if (!deliveryAddress.trim()) {
      toast.error("Please enter your delivery address")
      return
    }
    if (!billingName.trim()) {
      toast.error("Please enter your name")
      return
    }
    if (!billingEmail.trim()) {
      toast.error("Please enter your email")
      return
    }
    setStep("payment")
  }

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item")
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error("Please enter your delivery address")
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create payment
      const paymentRes = await authFetch("/api/marketplace/checkout/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Array.from(selectedItems),
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          billing_details: {
            name: billingName,
            email: billingEmail,
            phone: billingPhone,
          },
        }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.message || "Failed to create payment")
      }

      const paymentData = await paymentRes.json()

      // Step 2: Handle payment based on type
      if (paymentData.payment_type === "source") {
        // For e-wallet (GCash, GrabPay), redirect to checkout URL
        toast.success("Redirecting to payment...")
        
        // Store cart items and delivery address in sessionStorage for confirmation later
        sessionStorage.setItem("pending_payment", JSON.stringify({
          source_id: paymentData.source_id,
          cart_item_ids: Array.from(selectedItems),
          delivery_address: deliveryAddress,
        }))

        // Redirect to PayMongo checkout page
        window.location.href = paymentData.checkout_url
      } else {
        // For card payments, you would integrate PayMongo.js here
        toast.info("Card payment integration coming soon. Please use GCash or GrabPay for now.")
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error(error.message || "Failed to process checkout")
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-5 w-5" />
      case "gcash":
      case "grab_pay":
      case "paymaya":
        return <Wallet className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Credit/Debit Card"
      case "gcash":
        return "GCash"
      case "grab_pay":
        return "GrabPay"
      case "paymaya":
        return "PayMaya"
      default:
        return method
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Select items to purchase"}
            {step === "details" && "Enter delivery and billing details"}
            {step === "payment" && "Choose your payment method"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-2 ${step === "select" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "select" ? "bg-primary text-white" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Select Items</span>
            </div>
            <Separator className="w-12" />
            <div className={`flex items-center gap-2 ${step === "details" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-primary text-white" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <Separator className="w-12" />
            <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "payment" ? "bg-primary text-white" : "bg-muted"}`}>
                3
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>

          {/* Step 1: Item Selection */}
          {step === "select" && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedItems.size} of {cartItems.length} items selected
                </p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cartItems.map((item) => {
                  const isSelected = selectedItems.has(item._id)
                  const imageUrl = item.product_id.images?.[0] || "/placeholder.svg"

                  return (
                    <Card
                      key={item._id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => toggleItem(item._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <img
                            src={imageUrl}
                            alt={item.product_id.title}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-1">{item.product_id.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.product_id.seller_id.full_name} • {item.product_id.seller_id.location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-semibold text-primary">
                                ₱{item.product_id.price.toFixed(2)} / {item.product_id.unit}
                              </span>
                              <Badge variant="secondary">Qty: {item.quantity}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              ₱{(item.product_id.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2: Delivery & Billing Details */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-address">Delivery Address *</Label>
                <Textarea
                  id="delivery-address"
                  placeholder="Enter your complete delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <h3 className="font-semibold text-lg">Billing Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-name">Full Name *</Label>
                  <Input
                    id="billing-name"
                    placeholder="Juan Dela Cruz"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-phone">Phone Number</Label>
                  <Input
                    id="billing-phone"
                    placeholder="+63 912 345 6789"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-email">Email Address *</Label>
                <Input
                  id="billing-email"
                  type="email"
                  placeholder="juan@example.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      Payment Information
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Your billing details will be used for payment processing with PayMongo. 
                      All transactions are secure and encrypted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {step === "payment" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Choose Payment Method</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="space-y-3">
                  <Card className={`cursor-pointer transition-all ${paymentMethod === "gcash" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <RadioGroupItem value="gcash" id="gcash" />
                        {getPaymentIcon("gcash")}
                        <div className="flex-1">
                          <p className="font-medium">GCash</p>
                          <p className="text-sm text-muted-foreground">Pay via GCash e-wallet</p>
                        </div>
                        <Badge variant="secondary">Recommended</Badge>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${paymentMethod === "grab_pay" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <RadioGroupItem value="grab_pay" id="grab_pay" />
                        {getPaymentIcon("grab_pay")}
                        <div className="flex-1">
                          <p className="font-medium">GrabPay</p>
                          <p className="text-sm text-muted-foreground">Pay via GrabPay e-wallet</p>
                        </div>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className="opacity-50 cursor-not-allowed">
                    <CardContent className="p-4">
                      <label className="flex items-center gap-3">
                        <RadioGroupItem value="card" id="card" disabled />
                        {getPaymentIcon("card")}
                        <div className="flex-1">
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Coming soon</p>
                        </div>
                      </label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      Secure Payment via PayMongo
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      You'll be redirected to PayMongo's secure checkout page to complete your payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Subtotal ({selectedItems.size} items)</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>₱{deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {step !== "select" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "payment" ? "details" : "select")}
                disabled={isProcessing}
              >
                Back
              </Button>
            )}
            {step === "select" && (
              <Button
                className="flex-1"
                onClick={handleContinue}
                disabled={selectedItems.size === 0}
              >
                Continue to Details
              </Button>
            )}
            {step === "details" && (
              <Button
                className="flex-1"
                onClick={handleProceedToPayment}
                disabled={!deliveryAddress.trim() || !billingName.trim() || !billingEmail.trim()}
              >
                Proceed to Payment
              </Button>
            )}
            {step === "payment" && (
              <Button
                className="flex-1"
                onClick={handleCheckout}
                disabled={isProcessing || selectedItems.size === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₱{total.toFixed(2)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

