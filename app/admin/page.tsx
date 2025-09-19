"use client"

import { useState } from "react"
import { Users, MessageSquare, Package, TrendingUp, AlertTriangle, Shield, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Mock admin data
const adminStats = {
  totalUsers: 2847,
  activeUsers: 1923,
  newUsersToday: 47,
  totalListings: 1256,
  pendingReviews: 23,
  reportedContent: 8,
  totalRevenue: 45678,
  platformHealth: 94,
}

const recentActivity = [
  {
    id: 1,
    type: "user_registration",
    message: "New user registered: John Farmer",
    time: "2 minutes ago",
    severity: "info",
  },
  {
    id: 2,
    type: "content_report",
    message: "Forum post reported for inappropriate content",
    time: "15 minutes ago",
    severity: "warning",
  },
  {
    id: 3,
    type: "marketplace_listing",
    message: "New product listed: Organic Tomatoes",
    time: "1 hour ago",
    severity: "info",
  },
  {
    id: 4,
    type: "trust_violation",
    message: "User trust score dropped below threshold",
    time: "2 hours ago",
    severity: "error",
  },
]

const pendingActions = [
  {
    id: 1,
    type: "review_moderation",
    title: "Review flagged for inappropriate language",
    description: "User review contains potentially offensive content",
    priority: "high",
  },
  {
    id: 2,
    type: "user_verification",
    title: "Identity verification pending",
    description: "3 users awaiting identity verification",
    priority: "medium",
  },
  {
    id: 3,
    type: "listing_approval",
    title: "Product listings require approval",
    description: "5 new marketplace listings pending review",
    priority: "low",
  },
]

export default function AdminDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Platform management and moderation</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                System Healthy
              </Badge>
              <Link href="/admin/settings">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+{adminStats.newUsersToday} new today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((adminStats.activeUsers / adminStats.totalUsers) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalListings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Marketplace + Jobs</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.platformHealth}%</div>
                  <Progress value={adminStats.platformHealth} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Actions ({pendingActions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          action.priority === "high"
                            ? "destructive"
                            : action.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {action.priority}
                      </Badge>
                      <Button size="sm">Review</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.severity === "error"
                          ? "bg-red-500"
                          : activity.severity === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Link href="/admin/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">User Management</h3>
                      <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/content/marketplace">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Marketplace Content</h3>
                        <p className="text-muted-foreground">Moderate product listings and reviews</p>
                      </div>
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/content/community">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Community Content</h3>
                        <p className="text-muted-foreground">Moderate forum posts and discussions</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Link href="/admin/reports">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">User Reports</h3>
                      <p className="text-muted-foreground">Review and handle user-reported content</p>
                      <Badge variant="destructive" className="mt-2">
                        {adminStats.reportedContent} pending
                      </Badge>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
