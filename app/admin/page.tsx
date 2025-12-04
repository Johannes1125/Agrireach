"use client"

import { useState, useEffect } from "react"
import { Users, Package, TrendingUp, AlertTriangle, Shield, BarChart3, LineChart, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminOverview } from "@/hooks/use-admin-data"
import { RouteGuard } from "@/components/auth/route-guard"
import { authFetch } from "@/lib/auth-client"
import {
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts"

export default function AdminDashboard() {
  return (
    <RouteGuard requireAuth requiredRole="admin" redirectTo="/dashboard">
      <AdminDashboardContent />
    </RouteGuard>
  )
}

interface AnalyticsData {
  timeframe: string
  timeSeries: {
    userRegistrations: Array<{ date: string; value: number }>
    activeUsers: Array<{ date: string; value: number }>
    jobPostings: Array<{ date: string; value: number }>
    productListings: Array<{ date: string; value: number }>
    reports: Array<{ date: string; value: number }>
    reviews: Array<{ date: string; value: number }>
  }
  distributions: {
    userRoles: Array<{ name: string; value: number }>
    reportStatus: Array<{ name: string; value: number }>
    productCategories: Array<{ name: string; value: number }>
    jobCategories: Array<{ name: string; value: number }>
  }
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
}

const CHART_COLORS = [
  "hsl(221.2 83.2% 53.3%)", // blue
  "hsl(142.1 76.2% 36.3%)", // green
  "hsl(280 100% 70%)", // purple
  "hsl(24.6 95% 53.1%)", // orange
  "hsl(0 84.2% 60.2%)", // red
  "hsl(47.9 95.8% 53.1%)", // yellow
]

function AdminDashboardContent() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d")
  const { stats, loading } = useAdminOverview()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        const res = await authFetch(`/api/admin/analytics?timeframe=${selectedTimeframe}`)
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data.data || data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedTimeframe])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:px-6">
        <div className="space-y-6">
          {/* Enhanced Timeframe Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-card border-2 border-border shadow-sm">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground dark:text-foreground font-heading">Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">Track platform performance and user activity</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground hidden sm:inline">Timeframe:</span>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-[180px] bg-background border-2 border-border hover:border-primary/50 transition-colors text-foreground dark:text-foreground">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-200 dark:text-blue-300">Total Users</p>
                    <p className="text-3xl font-bold text-blue-100 dark:text-blue-200">{(stats?.totalUsers || 0).toLocaleString()}</p>
                    <p className="text-xs text-blue-200/80 dark:text-blue-300/80">All registered users</p>
                  </div>
                  <div className="p-3 bg-blue-500/30 dark:bg-blue-500/20 rounded-lg border border-blue-400/30 dark:border-blue-400/20 shadow-lg flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-200 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-200 dark:text-green-300">Active Users</p>
                    <p className="text-3xl font-bold text-green-100 dark:text-green-200">{(stats?.activeUsers || 0).toLocaleString()}</p>
                    <p className="text-xs text-green-200/80 dark:text-green-300/80">Currently active</p>
                  </div>
                  <div className="p-3 bg-green-500/30 dark:bg-green-500/20 rounded-lg border border-green-400/30 dark:border-green-400/20 shadow-lg flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-200 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-200 dark:text-purple-300">Total Listings</p>
                    <p className="text-3xl font-bold text-purple-100 dark:text-purple-200">{(stats?.totalListings || 0).toLocaleString()}</p>
                    <p className="text-xs text-purple-200/80 dark:text-purple-300/80">E-Commerce + Jobs</p>
                  </div>
                  <div className="p-3 bg-purple-500/30 dark:bg-purple-500/20 rounded-lg border border-purple-400/30 dark:border-purple-400/20 shadow-lg flex-shrink-0">
                    <Package className="h-8 w-8 text-purple-200 dark:text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-200 dark:text-emerald-300">Platform Health</p>
                    <p className="text-3xl font-bold text-emerald-100 dark:text-emerald-200">{stats?.platformHealth || 0}%</p>
                    <p className="text-xs text-emerald-200/80 dark:text-emerald-300/80">System status</p>
                  </div>
                  <div className="p-3 bg-emerald-500/30 dark:bg-emerald-500/20 rounded-lg border border-emerald-400/30 dark:border-emerald-400/20 shadow-lg flex-shrink-0">
                    <Shield className="h-8 w-8 text-emerald-200 dark:text-emerald-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* User Growth Area Chart */}
            <Card className="border-2 border-border/80 dark:border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 dark:from-card dark:via-card dark:to-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-500/30 dark:to-blue-600/20 shadow-sm">
                    <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="font-heading text-lg text-foreground dark:text-foreground">User Growth</span>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground font-normal mt-0.5">New user registrations over time</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analyticsLoading ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading analytics...</p>
                  </div>
                ) : analytics?.timeSeries ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsAreaChart data={analytics.timeSeries.userRegistrations}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))" 
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: "4px" }}
                        itemStyle={{ color: "hsl(var(--foreground))", padding: "4px 0" }}
                        labelFormatter={(label) => formatDate(label)}
                        cursor={{ stroke: CHART_COLORS[0], strokeWidth: 2, strokeDasharray: "5 5" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Users"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={3}
                        fill="url(#colorUsers)"
                        dot={{ fill: CHART_COLORS[0], r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                      />
                    </RechartsAreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground dark:text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground dark:text-foreground">No data available</p>
                    <p className="text-xs mt-1 text-muted-foreground dark:text-muted-foreground">Try selecting a different timeframe</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-2 border-border/80 dark:border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 dark:from-card dark:via-card dark:to-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-500/30 dark:to-orange-600/20 shadow-sm">
                    <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <span className="font-heading text-lg text-foreground dark:text-foreground">Top Categories</span>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground font-normal mt-0.5">Most popular product categories</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analyticsLoading ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading analytics...</p>
                  </div>
                ) : analytics?.distributions.productCategories &&
                  analytics.distributions.productCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart
                      data={[...analytics.distributions.productCategories]
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 8)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#9333ea" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))" 
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: "4px" }}
                        itemStyle={{ color: "hsl(var(--foreground))", padding: "4px 0" }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#barGradient)" 
                        radius={[8, 8, 0, 0]}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="top" 
                          fill="hsl(var(--foreground))"
                          style={{ fontSize: "12px", fontWeight: 600 }}
                        />
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground dark:text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground dark:text-foreground">No data available</p>
                    <p className="text-xs mt-1 text-muted-foreground dark:text-muted-foreground">Try selecting a different timeframe</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
             {/* User Role Distribution Pie Chart */}
             <Card className="border-2 border-border/80 dark:border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 dark:from-card dark:via-card dark:to-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-500/30 dark:to-purple-600/20 shadow-sm">
                    <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="font-heading text-lg text-foreground dark:text-foreground">User Role Distribution</span>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground font-normal mt-0.5">Breakdown by user roles</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analyticsLoading ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading analytics...</p>
                  </div>
                ) : analytics?.distributions.userRoles && analytics.distributions.userRoles.length > 0 ? (
                  (() => {
                    const totalValue = analytics.distributions.userRoles.reduce((sum: number, item: any) => sum + item.value, 0)
                    return (
                      <div className="relative" style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={analytics.distributions.userRoles}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => {
                                const percentage = ((entry.value / totalValue) * 100).toFixed(0)
                                return `${percentage}%`
                              }}
                              outerRadius={100}
                              innerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {analytics.distributions.userRoles.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "12px",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                padding: "12px",
                              }}
                              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: "4px" }}
                              itemStyle={{ color: "hsl(var(--foreground))", padding: "4px 0" }}
                              formatter={(value: number, name: string) => [
                                `${value} (${((value / totalValue) * 100).toFixed(0)}%)`,
                                name
                              ]}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-foreground">
                            {totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground dark:text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground dark:text-foreground">No data available</p>
                    <p className="text-xs mt-1 text-muted-foreground dark:text-muted-foreground">Try selecting a different timeframe</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Overview Area Chart */}
            <Card className="border-2 border-border/80 dark:border-border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 dark:from-card dark:via-card dark:to-card/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 dark:from-green-500/30 dark:to-green-600/20 shadow-sm">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-heading text-lg text-foreground dark:text-foreground">Activity Overview</span>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground font-normal mt-0.5">Daily active user sessions</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analyticsLoading ? (
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading analytics...</p>
                  </div>
                ) : analytics?.timeSeries ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsAreaChart data={analytics.timeSeries.activeUsers}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))" 
                        style={{ fontSize: "12px", fill: "hsl(var(--foreground))" }}
                        tick={{ fill: "hsl(var(--foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          padding: "12px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: "4px" }}
                        itemStyle={{ color: "hsl(var(--foreground))", padding: "4px 0" }}
                        labelFormatter={(label) => formatDate(label)}
                        cursor={{ stroke: CHART_COLORS[1], strokeWidth: 2, strokeDasharray: "5 5" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Users"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={3}
                        fill="url(#colorActive)"
                        dot={{ fill: CHART_COLORS[1], r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                      />
                    </RechartsAreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground dark:text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground dark:text-foreground">No data available</p>
                    <p className="text-xs mt-1 text-muted-foreground dark:text-muted-foreground">Try selecting a different timeframe</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
