"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/app-layout"
import { PageTransition } from "@/components/ui/page-transition"
import { RouteGuard } from "@/components/auth/route-guard"
import {
  Bell,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Star,
  Info,
  Search,
  Award as MarkAsRead,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { authFetch } from "@/lib/auth-client"

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

export default function NotificationsPage() {
  return (
    <RouteGuard requireAuth>
      <NotificationsPageContent />
    </RouteGuard>
  )
}

function NotificationsPageContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "job" | "order" | "message" | "review" | "system">("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchNotifications()
  }, [])

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
          read: n.read || false,
          priority: n.priority,
          actionUrl: n.action_url,
        }))
        setNotifications(formattedNotifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter = filter === "all" || (filter === "unread" ? !notification.read : notification.type === filter)
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
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
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  return (
    <AppLayout>
      <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-heading text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">Stay updated with your AgriReach activity</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={markAllAsRead}>
                  <MarkAsRead className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full md:w-auto">
                    <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="job">Jobs</TabsTrigger>
                      <TabsTrigger value="order">Orders</TabsTrigger>
                      <TabsTrigger value="message">Messages</TabsTrigger>
                      <TabsTrigger value="system">System</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Activity</span>
                  <Badge variant="secondary">{filteredNotifications.length} notifications</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-heading text-lg font-semibold mb-2">No notifications found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search terms" : "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-6 hover:bg-muted/50 transition-colors ${
                          !notification.read ? "bg-primary/5 border-l-4 border-l-primary" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground mb-1">{notification.title}</h4>
                                <p className="text-muted-foreground mb-2">{notification.message}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                                  <Badge
                                    variant={
                                      notification.priority === "high"
                                        ? "destructive"
                                        : notification.priority === "medium"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {notification.priority} priority
                                  </Badge>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs"
                                  >
                                    Mark as read
                                  </Button>
                                )}
                                {/* Delete button removed - notifications persist to maintain history */}
                              </div>
                            </div>
                            {notification.actionUrl && (
                              <div className="mt-3">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={notification.actionUrl}>View Details</a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </PageTransition>
    </AppLayout>
  )
}
