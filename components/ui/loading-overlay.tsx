"use client"

import { motion, AnimatePresence } from "framer-motion"
import { SpinnerLoader, DotsLoader } from "./framer-loader"
import { ReactNode } from "react"

interface LoadingOverlayProps {
  loading: boolean
  children: ReactNode
  text?: string
  variant?: "spinner" | "dots"
  blur?: boolean
}

export function LoadingOverlay({
  loading,
  children,
  text,
  variant = "spinner",
  blur = true
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {loading && (
          <motion.div
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 ${
              blur ? "backdrop-blur-sm" : ""
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {variant === "spinner" ? (
                <SpinnerLoader size={40} className="text-primary" />
              ) : (
                <DotsLoader size={12} className="text-primary" />
              )}
              
              {text && (
                <motion.p
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {text}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FullScreenLoadingProps {
  loading: boolean
  text?: string
}

export function FullScreenLoading({ loading, text = "Loading..." }: FullScreenLoadingProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SpinnerLoader size={60} className="text-primary" />
            
            <motion.p
              className="text-base font-medium text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

