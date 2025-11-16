"use client"

import { useState, useEffect } from "react"
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
import { PhilippineAddressSelector, PhilippineAddress, formatPhilippineAddress, isAddressComplete } from "@/components/ui/philippine-address-selector"
import { 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Banknote
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
  const [deliveryAddress, setDeliveryAddress] = useState<PhilippineAddress>({
    region: "",
    province: "",
    city: "",
    barangay: "",
    streetAddress: "",
    zipCode: ""
  })
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gcash" | "grab_pay" | "paymaya" | "cod">("gcash")
  const [billingName, setBillingName] = useState("")
  const [billingEmail, setBillingEmail] = useState("")
  const [billingPhone, setBillingPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"select" | "details" | "payment">("select")
  const [userData, setUserData] = useState<{
    full_name?: string
    email?: string
    phone?: string
  } | null>(null)

  // Fetch user data when modal opens
  useEffect(() => {
    if (open) {
      fetchUserData()
    }
  }, [open])

  // Sync selectedItems with current cartItems when cartItems change
  useEffect(() => {
    if (open && cartItems.length > 0) {
      // Only select items that still exist in the cart
      const validItemIds = cartItems.map(item => item._id)
      setSelectedItems(prev => {
        const newSet = new Set<string>()
        prev.forEach(id => {
          if (validItemIds.includes(id)) {
            newSet.add(id)
          }
        })
        return newSet
      })
    } else if (open && cartItems.length === 0) {
      // Clear selected items if cart is empty
      setSelectedItems(new Set())
    }
  }, [cartItems, open])

  const fetchUserData = async () => {
    try {
      const res = await authFetch("/api/users/me")
      if (res.ok) {
        const data = await res.json()
        const user = data.data?.user || data.user
        if (user) {
          setUserData({
            full_name: user.full_name || user.name,
            email: user.email,
            phone: user.phone
          })
          // Auto-populate billing fields
          setBillingName(user.full_name || user.name || "")
          setBillingEmail(user.email || "")
          setBillingPhone(user.phone || "")
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

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
    if (!isAddressComplete(deliveryAddress)) {
      toast.error("Please complete your delivery address")
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

    // Check if selected items still exist in cart
    const validSelectedItems = cartItems.filter(item => selectedItems.has(item._id))
    if (validSelectedItems.length === 0) {
      toast.error("Selected items are no longer available. Please refresh and try again.")
      return
    }

    if (!isAddressComplete(deliveryAddress)) {
      toast.error("Please complete your delivery address")
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

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    // Map Philippine address to validation schema format
    const mappedDeliveryAddress = {
      line1: deliveryAddress.streetAddress || deliveryAddress.barangay || "",
      line2: "", // Optional field
      city: deliveryAddress.city || "",
      state: deliveryAddress.province || "",
      postal_code: deliveryAddress.zipCode || "",
      country: "PH"
    }

    // Validate mapped address has required fields
    if (!mappedDeliveryAddress.line1 || !mappedDeliveryAddress.city || !mappedDeliveryAddress.state || !mappedDeliveryAddress.postal_code) {
      toast.error("Please complete all required address fields (street address, city, province, and postal code)")
      return
    }

    setIsProcessing(true)

    try {

      // Debug logging
      const requestData = {
        items: validSelectedItems.map(item => item._id),
        delivery_address: formatPhilippineAddress(deliveryAddress) || "Incomplete address",
        delivery_address_structured: mappedDeliveryAddress,
        payment_method: paymentMethod,
        billing_details: {
          name: billingName,
          email: billingEmail,
          ...(billingPhone && { phone: billingPhone }),
        },
      }
      
      console.log("Checkout data:", requestData)
      console.log("Individual field validation:", {
        itemsValid: validSelectedItems.length > 0,
        deliveryAddressValid: formatPhilippineAddress(deliveryAddress).length > 0,
        paymentMethodValid: !!paymentMethod,
        billingNameValid: !!billingName?.trim(),
        billingEmailValid: !!billingEmail?.trim(),
        mappedAddressValid: !!(mappedDeliveryAddress.line1 && mappedDeliveryAddress.city && mappedDeliveryAddress.state && mappedDeliveryAddress.postal_code),
      })

      // Step 1: Create payment
      const paymentRes = await authFetch("/api/marketplace/checkout/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      console.log("Payment response status:", paymentRes.status)
      console.log("Payment response headers:", Object.fromEntries(paymentRes.headers.entries()))

      if (!paymentRes.ok) {
        let error
        try {
          error = await paymentRes.json()
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          error = { message: `HTTP ${paymentRes.status}: ${paymentRes.statusText}` }
        }
        console.error("Payment API Error:", error)
        
        // Handle different error response formats
        let errorMessage = "Failed to create payment"
        if (error && typeof error === 'object') {
          if (error.message && typeof error.message === 'string') {
            errorMessage = error.message
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        // Ensure we always have a valid string
        const finalErrorMessage = errorMessage || "Failed to create payment"
        console.error("Final error message:", finalErrorMessage)
        throw new Error(finalErrorMessage)
      }

      const paymentData = await paymentRes.json()
      console.log("Payment API Response:", paymentData)

      // Extract the actual data from the response
      const actualData = paymentData.data || paymentData
      console.log("Actual payment data:", actualData)

      // Step 2: Handle payment based on type
      if (actualData.payment_type === "cod") {
        // For Cash on Delivery, show success message
        toast.success("Order placed successfully! Payment will be collected upon delivery.")
        onSuccess()
        onClose()
      } else if (actualData.payment_type === "source") {
        // For PayMongo e-wallet payments (GCash, GrabPay) - redirect to checkout URL
        toast.success("Redirecting to payment...")
        
        // Store cart items in sessionStorage for confirmation later
        sessionStorage.setItem("pending_payment", JSON.stringify({
          source_id: actualData.source_id,
          payment_id: actualData.payment_id,
          cart_item_ids: Array.from(selectedItems),
          delivery_address: deliveryAddress,
        }))

        // Redirect to PayMongo checkout URL
        if (actualData.checkout_url) {
          window.location.href = actualData.checkout_url
        } else {
          toast.error("Payment URL not available. Please try again.")
        }
      } else if (actualData.payment_type === "payment_intent") {
        // For card payments - use PayMongo JS SDK
        toast.success("Initializing payment...")
        
        // Store payment data and redirect to payment page
        sessionStorage.setItem('paymongo_payment', JSON.stringify({
          payment_intent_id: actualData.payment_intent_id,
          client_key: actualData.client_key,
          payment_id: actualData.payment_id,
        }))
        
        // Redirect to payment processing page
        window.location.href = `/marketplace/payment/process?payment_id=${actualData.payment_id}`
      } else {
        toast.error("Unknown payment type. Please try again.")
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
      case "cod":
        return <Banknote className="h-5 w-5" />
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
      case "cod":
        return "Cash on Delivery"
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
                <Label>Delivery Address *</Label>
                <PhilippineAddressSelector
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  showStreetAddress={true}
                  showZipCode={true}
                  showMap={true}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <Card className={`cursor-pointer transition-all ${paymentMethod === "cod" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <RadioGroupItem value="cod" id="cod" />
                        {getPaymentIcon("cod")}
                        <div className="flex-1">
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                        <Badge variant="outline">Popular</Badge>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${paymentMethod === "card" ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        {getPaymentIcon("card")}
                        <div className="flex-1">
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Pay via credit or debit card</p>
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
                disabled={!isAddressComplete(deliveryAddress) || !billingName.trim() || !billingEmail.trim()}
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

