"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Shield, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface TwoFactorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerified: () => void
}

export function TwoFactorModal({ open, onOpenChange, email, onVerified }: TwoFactorModalProps) {
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) return

    setIsVerifying(true)
    // Simulate 2FA verification
    setTimeout(() => {
      setIsVerifying(false)
      toast("Authentication successful! You have been securely logged in.")
      onVerified()
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Two-Factor Authentication</DialogTitle>
          <DialogDescription className="text-center">
            Enter the 6-digit code from your authenticator app
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <p className="text-sm text-muted-foreground text-center">
              Can't access your authenticator?{" "}
              <Button variant="link" className="h-auto p-0 text-sm font-medium text-primary">
                Use backup code
              </Button>
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full h-11 gradient-primary"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify & Sign In
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
