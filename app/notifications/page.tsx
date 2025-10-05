"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/app-layout"
import {
  Bell,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Star,
  Info,
  Search,
  Award as MarkAsRead,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "job",
      title: "New Job Application",
      message: "Maria Rodriguez applied for Seasonal Harvest Workers position",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      read: false,
      priority: "high",
      actionUrl: "/dashboard?tab=recruiter",
    },
    {
      id: "2",
      type: "order",
      title: "Order Shipped",
      message: "Your organic tomatoes order has been shipped and will arrive tomorrow",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      priority: "medium",
      actionUrl: "/dashboard?tab=buyer",
    },
  ])

  const [filter, setFilter] = useState<"all" | "unread" | "job" | "order" | "message" | "review" | "system">("all")
  const [searchTerm, setSearchTerm] = useState("")

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

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <AppLayout>
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
                {filteredNotifications.length === 0 ? (
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
    </AppLayout>
  )
}
