"use client"

import { motion } from "framer-motion"

interface FramerLoaderProps {
  size?: number
  color?: string
  className?: string
}

// Spinning Circle Loader
export function SpinnerLoader({ size = 40, color = "currentColor", className = "" }: FramerLoaderProps) {
  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        border: `${size / 10}px solid transparent`,
        borderTopColor: color,
        borderRadius: "50%",
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

// Pulsing Dots Loader
export function DotsLoader({ size = 12, color = "currentColor", className = "" }: FramerLoaderProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: "50%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Bouncing Loader
export function BouncingLoader({ size = 16, color = "currentColor", className = "" }: FramerLoaderProps) {
  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height: size * 2 }}>
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          style={{
            width: size / 2,
            height: size / 2,
            backgroundColor: color,
            borderRadius: "2px",
          }}
          animate={{
            height: [size / 2, size * 1.5, size / 2],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Orbital Loader
export function OrbitalLoader({ size = 40, color = "currentColor", className = "" }: FramerLoaderProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            width: size / 4,
            height: size / 4,
            backgroundColor: color,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            originX: `-${size / 2}px`,
            originY: 0,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Progress Dots Loader
export function ProgressDotsLoader({ size = 10, color = "currentColor", className = "" }: FramerLoaderProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: "50%",
          }}
          animate={{
            y: [0, -size * 1.5, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

