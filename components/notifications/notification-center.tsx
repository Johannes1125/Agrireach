"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Briefcase, ShoppingCart, MessageSquare, Star, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { authFetch } from "@/lib/auth-client"
import { subscribeToNotificationChannel, unsubscribeFromNotificationChannel } from "@/lib/pusher"

interface Notification {
  id: string
  type: "job" | "order" | "message" | "review" | "system"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high"
  actionUrl?: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Subscribe to real-time notifications via Pusher
  useEffect(() => {
    if (!user?.id) return

    const channel = subscribeToNotificationChannel(user.id)
    
    channel.bind('new-notification', (data: any) => {
      // Format the notification to match the component's expected format
      const formattedNotification: Notification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.created_at),
        read: data.read || false,
        priority: data.priority || 'medium',
        actionUrl: data.action_url,
      }
      
      // Add new notification to the list
      setNotifications((prev) => [formattedNotification, ...prev])
      // Increment unread count
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      channel.unbind('new-notification')
      unsubscribeFromNotificationChannel(user.id)
    }
  }, [user?.id])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Fetch all notifications (read and unread) - increased limit to show more notifications
      const res = await authFetch("/api/notifications?limit=100")
      if (res.ok) {
        const response = await res.json()
        // jsonOk wraps response in { success: true, data: { notifications, total, unreadCount, ... } }
        const data = response?.data || {}
        const notificationsArray = Array.isArray(data?.notifications) ? data.notifications : []
        const formattedNotifications = notificationsArray.map((n: any) => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at),
          read: n.read || false, // Preserve read status
          priority: n.priority,
          actionUrl: n.action_url,
        }))
        setNotifications(formattedNotifications)
        setUnreadCount(Number.isFinite(data?.unreadCount) ? data.unreadCount : 0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }


  // unreadCount is now managed by state from API

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-4 w-4 ${
      priority === "high" ? "text-destructive" : priority === "medium" ? "text-primary" : "text-muted-foreground"
    }`

    switch (type) {
      case "job":
        return <Briefcase className={iconClass} />
      case "order":
        return <ShoppingCart className={iconClass} />
      case "message":
        return <MessageSquare className={iconClass} />
      case "review":
        return <Star className={iconClass} />
      case "system":
        return <Info className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await authFetch(`/api/notifications/${id}/read`, { method: "PUT" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/notifications/read-all", { method: "PUT" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const removeNotification = (id: string) => {
    // Only remove from local state - notifications persist in database
    // They will reappear on reload, which is the desired behavior
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    // Note: This only removes from UI temporarily. On page reload, all notifications will be fetched again.
  }

  return (
    <DropdownMenu onOpenChange={(open) => {
      // Refresh notifications when dropdown opens
      if (open) {
        fetchNotifications()
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-primary/10 transition-all duration-200 hover:scale-105 rounded-full p-2"
        >
          <Bell className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ring-2 ring-background animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-heading text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                          {/* Delete button removed - notifications persist to maintain history */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm" asChild>
                <a href="/notifications">View all notifications</a>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
