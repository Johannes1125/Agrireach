"use client"

import { motion } from "framer-motion"
import { SpinnerLoader, DotsLoader, BouncingLoader, ProgressDotsLoader } from "./framer-loader"

interface PageLoaderProps {
  text?: string
  variant?: "spinner" | "dots" | "bounce" | "progress"
  size?: "sm" | "md" | "lg"
}

export function PageLoader({ 
  text = "Loading...", 
  variant = "spinner",
  size = "md" 
}: PageLoaderProps) {
  const sizeMap = {
    sm: 30,
    md: 50,
    lg: 70
  }

  const spinnerSize = sizeMap[size]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: "easeIn" as const
      }
    }
  }

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  }

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <DotsLoader size={spinnerSize / 4} className="text-primary" />
      case "bounce":
        return <BouncingLoader size={spinnerSize / 3} className="text-primary" />
      case "progress":
        return <ProgressDotsLoader size={spinnerSize / 5} className="text-primary" />
      default:
        return <SpinnerLoader size={spinnerSize} className="text-primary" />
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        {renderLoader()}
        
        <motion.p
          className="text-sm font-medium text-muted-foreground"
          variants={textVariants}
          initial="hidden"
          animate="visible"
        >
          {text}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

export function InlineLoader({ 
  text, 
  variant = "dots",
  size = "sm" 
}: PageLoaderProps) {
  const sizeMap = {
    sm: 20,
    md: 30,
    lg: 40
  }

  const spinnerSize = sizeMap[size]

  const renderLoader = () => {
    switch (variant) {
      case "bounce":
        return <BouncingLoader size={spinnerSize} className="text-primary" />
      case "progress":
        return <ProgressDotsLoader size={spinnerSize / 2} className="text-primary" />
      case "spinner":
        return <SpinnerLoader size={spinnerSize} className="text-primary" />
      default:
        return <DotsLoader size={spinnerSize / 2} className="text-primary" />
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {renderLoader()}
      
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
  )
}

