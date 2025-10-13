"use client"

import { useState } from "react"
import { Users, Package, TrendingUp, AlertTriangle, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAdminOverview } from "@/hooks/use-admin-data"
import { RouteGuard } from "@/components/auth/route-guard"

// Real admin data via hook

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
  return (
    <RouteGuard requireAuth requiredRole="admin" redirectTo="/dashboard">
      <AdminDashboardContent />
    </RouteGuard>
  )
}

function AdminDashboardContent() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d")
  const { stats, loading } = useAdminOverview()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 lg:px-6">
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:px-6">
        <div className="space-y-6">
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900">{(stats?.totalUsers || 0).toLocaleString()}</p>
                    <p className="text-xs text-blue-500">+{stats?.newUsersToday || 0} new today</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600">Active Users</p>
                    <p className="text-3xl font-bold text-green-900">{(stats?.activeUsers || 0).toLocaleString()}</p>
                    <p className="text-xs text-green-500">
                      {stats && stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-600">Total Listings</p>
                    <p className="text-3xl font-bold text-purple-900">{(stats?.totalListings || 0).toLocaleString()}</p>
                    <p className="text-xs text-purple-500">Marketplace + Jobs</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-600">Platform Health</p>
                    <p className="text-3xl font-bold text-emerald-900">{stats?.platformHealth || 0}%</p>
                    <div className="mt-2">
                      <Progress value={stats?.platformHealth || 0} className="h-2 bg-emerald-100" />
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Shield className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  )
}
