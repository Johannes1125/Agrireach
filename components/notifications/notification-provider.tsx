"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { toast } from "sonner"

interface NotificationContextType {
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const showSuccess = useCallback(
    (title: string, description?: string) => {
      toast.success(title, { description })
    },
    [],
  )

  const showError = useCallback(
    (title: string, description?: string) => {
      toast.error(title, { description })
    },
    [],
  )

  const showInfo = useCallback(
    (title: string, description?: string) => {
      toast.info(title, { description })
    },
    [],
  )

  const showWarning = useCallback(
    (title: string, description?: string) => {
      toast.warning(title, { description })
    },
    [],
  )

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
