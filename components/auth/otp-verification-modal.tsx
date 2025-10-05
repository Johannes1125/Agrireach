"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Mail, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface OTPVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerified: () => void
  onConfirm?: (code: string) => Promise<void>
}

export function OTPVerificationModal({ open, onOpenChange, email, onVerified, onConfirm }: OTPVerificationModalProps) {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) return
    setIsVerifying(true)
    try {
      if (onConfirm) {
        await onConfirm(otp)
      } else {
        const res = await fetch("/api/auth/verify/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: otp }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || "Invalid code")
      }
      toast(
        <>
          <span className="font-semibold">Email verified!</span>
          <div className="text-sm text-muted-foreground">Your account has been successfully created.</div>
        </>
      )
      onVerified()
    } catch (err: any) {
      toast.error(err?.message || "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const res = await fetch("/api/auth/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || "Failed to resend")
      toast(
        <>
          <span className="font-semibold">Code resent</span>
          <div className="text-sm text-muted-foreground">A new verification code has been sent to your email.</div>
        </>
      )
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Verify your email</DialogTitle>
          <DialogDescription className="text-center">
            We've sent a 6-digit verification code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium text-primary"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? "Resending..." : "Resend"}
              </Button>
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
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
                Verify Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
