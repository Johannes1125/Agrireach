"use client"

import { useState } from "react"
import { ArrowLeft, Search, Shield, Ban, CheckCircle, AlertTriangle, Settings, XCircle, BadgeCheck, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { toast } from "sonner"
import { useAdminUsers, adminUserAction } from "@/hooks/use-admin-data"
import { useAdminUserStats } from "@/hooks/use-admin-user-stats"

const statusColors = {
  active: "bg-green-500",
  suspended: "bg-red-500",
  pending: "bg-yellow-500",
  banned: "bg-gray-500",
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const { users, loading, error, refetch } = useAdminUsers({
    status: statusFilter,
    role: roleFilter,
    search: searchTerm,
  })
  const { stats: userStats, loading: statsLoading } = useAdminUserStats()

  const filteredUsers = users

  const handleUserAction = async (userId: string, action: string) => {
    try {
      if (action === 'view') {
        window.open(`/profile?user=${userId}`, '_blank')
        return
      }
      if (action === 'edit') {
        // TODO: Navigate to edit user page or open edit modal
        toast.info('Edit user functionality coming soon')
        return
      }
      // Map 'activate' to 'unsuspend' for the API
      const actionMap: Record<string, string> = {
        'activate': 'unsuspend',
        'approve_verification': 'verify',
        'reject_verification': 'reject',
      }
      const mappedAction = actionMap[action] || action
      const mapped = mappedAction === 'verify' || mappedAction === 'unverify' || mappedAction === 'reject' || mappedAction === 'suspend' || mappedAction === 'unsuspend' || mappedAction === 'ban' ? mappedAction : null
      if (!mapped) return toast.info('Unsupported action')
      await adminUserAction(userId, mapped as "verify" | "unverify" | "reject" | "suspend" | "unsuspend" | "ban" | "role")
      toast.success('Updated')
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
            </div>
            <Button>Export Users</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{statsLoading ? "..." : (userStats?.totalUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">All registered users</p>
                </div>
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-300">{statsLoading ? "..." : (userStats?.activeUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-500 dark:text-green-400">Currently active</p>
                </div>
                <div className="p-3 bg-green-500/10 dark:bg-green-500/20 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Suspended</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-300">{statsLoading ? "..." : (userStats?.suspendedUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-500 dark:text-red-400">Account suspended</p>
                </div>
                <div className="p-3 bg-red-500/10 dark:bg-red-500/20 rounded-xl">
                  <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-300">{statsLoading ? "..." : (userStats?.pendingReviewUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-amber-500 dark:text-amber-400">Awaiting verification</p>
                </div>
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-8 border-0 shadow-md bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-2 border-border focus:border-primary rounded-xl bg-muted/50 focus:bg-background transition-all duration-200"
                />
              </div>

              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-12 border-2 border-border focus:border-primary rounded-xl bg-muted/50 focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">✅ Active</SelectItem>
                    <SelectItem value="suspended">⏸️ Suspended</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="banned">🚫 Banned</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48 h-12 border-2 border-border focus:border-primary rounded-xl bg-muted/50 focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Worker">👤 Member</SelectItem>
                    <SelectItem value="Recruiter">🏢 Employer</SelectItem>
                    <SelectItem value="Buyer">🛒 Trader</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Users Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Users ({filteredUsers.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage and monitor user accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  System Healthy
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                <Table className="min-w-full">
                <TableHeader className="bg-muted/50 backdrop-blur-sm sticky top-0 z-10">
                  <TableRow className="border-b-2 border-border hover:bg-transparent">
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[300px]">User</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[120px]">Role</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[100px]">Status</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[140px]">Verification</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[120px]">Trust Score</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[140px]">Last Active</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[100px]">Reports</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/50 transition-all duration-200 border-b border-border group">
                      <TableCell className="px-6 py-4 min-w-[300px]">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary transition-all duration-200">
                            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {user.full_name ? user.full_name.split(" ").map((n) => n[0]).join("") : "U"}
                            </AvatarFallback>
                          </Avatar>
                          {user.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{user.full_name || "User"}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.verified ? (
                              <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[120px]">
                        {(() => {
                        const r = String(user.role || "").toLowerCase()
                        const roleConfig = {
                          buyer: { label: "Trader", class: "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: "🛒" },
                          recruiter: { label: "Employer", class: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: "🏢" },
                          worker: { label: "Member", class: "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: "👤" },
                          admin: { label: "Admin", class: "bg-purple-100 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: "👑" }
                        }
                        const config = roleConfig[r as keyof typeof roleConfig] || { label: "User", class: "bg-muted text-muted-foreground border-border", icon: "👤" }
                        return (
                          <Badge variant="outline" className={`${config.class} font-medium`}>
                            <span className="mr-1">{config.icon}</span>
                            {config.label}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[100px]">
                        <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[user.status as keyof typeof statusColors]} shadow-sm`} />
                        <span className="font-medium capitalize text-foreground">{user.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 min-w-[140px]">
                      {(() => {
                        const status = (user.verification_status as string) || (user.verified ? "verified" : "none")
                        switch (status) {
                          case "verified":
                            return (
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            )
                          case "pending":
                            return (
                              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                Pending Review
                              </Badge>
                            )
                          case "rejected":
                            return (
                              <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Rejected
                              </Badge>
                            )
                          default:
                            return (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                Not Verified
                              </Badge>
                            )
                        }
                      })()}
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[120px]">
                        {user.trust_score > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < user.trust_score ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-foreground">{user.trust_score}/5</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 min-w-[140px] text-sm text-muted-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[100px]">
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                          -
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4">
                        <div className="flex flex-row flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user._id, "view")}
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center"
                          >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">View Profile</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user._id, "edit")}
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center"
                          >
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Edit User</span>
                          </Button>
                          {(user.verification_status === "pending") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user._id, "approve_verification")}
                                className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Approve Verification</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user._id, "reject_verification")}
                                className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Reject Verification</span>
                              </Button>
                            </>
                          )}
                          {user.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user._id, "suspend")}
                              className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Ban className="h-4 w-4" />
                              <span className="sr-only">Suspend User</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user._id, "activate")}
                              className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Activate User</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
