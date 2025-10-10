"use client"

import { motion } from "framer-motion"
import { SpinnerLoader } from "./framer-loader"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

interface LoadingButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  children: ReactNode
  asChild?: boolean
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  variant,
  size,
  asChild,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("relative", className)}
      variant={variant}
      size={size}
      asChild={asChild}
      {...props}
    >
      <motion.span
        className="flex items-center gap-2"
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      
      {loading && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <SpinnerLoader size={16} color="currentColor" />
          {loadingText && <span>{loadingText}</span>}
        </motion.span>
      )}
    </Button>
  )
}

