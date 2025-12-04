"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Minus, Trash2, X, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface CartItem {
  id: number
  name: string
  price: number
  unit: string
  quantity: number
  image: string
  seller: string
}

interface ShoppingCartProps {
  items: CartItem[]
  onUpdateQuantity: (id: number, quantity: number) => void
  onRemoveItem: (id: number) => void
  onCheckout?: () => void
}

export function ShoppingCartComponent({ items, onUpdateQuantity, onRemoveItem, onCheckout }: ShoppingCartProps) {
  const [isOpen, setIsOpen] = useState(false)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative bg-transparent hover:bg-muted/50">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md p-0 h-full">
        <SheetHeader className="px-6 py-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-semibold">Shopping Cart</SheetTitle>
              {totalItems > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100vh-5rem)]">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted rounded-full p-8 mb-6">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Your cart is empty</h3>
                <p className="text-muted-foreground text-base max-w-sm">
                  Add some products to your cart and they'll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden shadow-sm border border-border/50">
                    <CardContent className="p-0">
                      <div className="flex p-4">
                        <div className="relative w-24 h-24 flex-shrink-0 mr-4">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <div className="min-w-0 flex-1 pr-3">
                              <h3 className="font-semibold text-base leading-tight mb-1 line-clamp-2">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">by {item.seller}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground border-border"
                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-base font-medium w-10 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground border-border"
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold text-primary">
                                ₱{(item.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₱{item.price.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t bg-background px-6 py-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">₱{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Delivery fee
                  </span>
                  <span className="text-sm text-muted-foreground italic">Calculated at checkout</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping varies by location (₱39 - ₱150)
                </p>
                <Separator className="my-4" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">₱{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                size="lg"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg" 
                onClick={() => {
                  setIsOpen(false);
                  onCheckout?.();
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}