"use client"

import { motion } from "framer-motion"
import { SpinnerLoader } from "./framer-loader"

interface ContentLoaderProps {
  text?: string
}

export function ContentLoader({ text = "Loading..." }: ContentLoaderProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <SpinnerLoader size={40} className="text-primary" />
        <motion.p
          className="text-sm font-medium text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.15 }}
        >
          {text}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

