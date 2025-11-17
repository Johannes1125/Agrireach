"use client"

import { useState } from "react"
import { ArrowLeft, Search, Shield, Ban, CheckCircle, AlertTriangle, XCircle, BadgeCheck, Clock3, Loader2, Eye, Mail, Phone, MapPin, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { toast } from "sonner"
import { useAdminUsers, adminUserAction } from "@/hooks/use-admin-data"
import { useAdminUserStats } from "@/hooks/use-admin-user-stats"
import { authFetch } from "@/lib/auth-client"

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
  const [viewUserOpen, setViewUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [viewUserLoading, setViewUserLoading] = useState(false)
  const [verifyUserOpen, setVerifyUserOpen] = useState(false)
  const [verifyUserLoading, setVerifyUserLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; userId: string; action: string; userName: string }>({ open: false, userId: '', action: '', userName: '' })

  const { users, loading, error, refetch } = useAdminUsers({
    status: statusFilter,
    role: roleFilter,
    search: searchTerm,
  })
  const { stats: userStats, loading: statsLoading } = useAdminUserStats()

  const filteredUsers = users

  const handleViewUser = async (userId: string) => {
    setViewUserLoading(true)
    setViewUserOpen(true)
    try {
      const res = await authFetch(`/api/users/${userId}`)
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setSelectedUser(json?.data?.user || json?.user)
      } else {
        toast.error('Failed to load user details')
        setViewUserOpen(false)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load user')
      setViewUserOpen(false)
    } finally {
      setViewUserLoading(false)
    }
  }

  const handleViewVerification = async (userId: string) => {
    setVerifyUserLoading(true)
    setVerifyUserOpen(true)
    try {
      // Get user details
      const userRes = await authFetch(`/api/users/${userId}`)
      const userJson = await userRes.json().catch(() => ({}))
      if (userRes.ok) {
        setSelectedUser(userJson?.data?.user || userJson?.user)
      } else {
        toast.error('Failed to load user details')
        setVerifyUserOpen(false)
        return
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load user')
      setVerifyUserOpen(false)
    } finally {
      setVerifyUserLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    try {
      // Map 'activate' to 'unsuspend' for the API
      const actionMap: Record<string, string> = {
        'activate': 'unsuspend',
        'approve_verification': 'verify',
        'reject_verification': 'reject',
      }
      const mappedAction = actionMap[confirmAction.action] || confirmAction.action
      const mapped = mappedAction === 'verify' || mappedAction === 'unverify' || mappedAction === 'reject' || mappedAction === 'suspend' || mappedAction === 'unsuspend' || mappedAction === 'ban' ? mappedAction : null
      if (!mapped) {
        toast.error('Unsupported action')
        return
      }
      await adminUserAction(confirmAction.userId, mapped as "verify" | "unverify" | "reject" | "suspend" | "unsuspend" | "ban" | "role")
      toast.success('Action completed successfully')
      setConfirmAction({ open: false, userId: '', action: '', userName: '' })
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to perform action')
    }
  }

  const handleUserAction = (userId: string, action: string, userName: string) => {
    if (action === 'view') {
      handleViewUser(userId)
      return
    }
    if (action === 'view_verification') {
      handleViewVerification(userId)
      return
    }
    // Show confirmation modal for all other actions
    setConfirmAction({ open: true, userId, action, userName })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-200 dark:text-blue-300">Total Users</p>
                  <p className="text-3xl font-bold text-blue-100 dark:text-blue-200">{statsLoading ? "..." : (userStats?.totalUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-blue-200/80 dark:text-blue-300/80">All registered users</p>
                </div>
                <div className="p-3 bg-blue-500/30 dark:bg-blue-500/20 rounded-lg border border-blue-400/30 dark:border-blue-400/20 shadow-lg flex-shrink-0">
                  <Shield className="h-8 w-8 text-blue-200 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-200 dark:text-green-300">Active Users</p>
                  <p className="text-3xl font-bold text-green-100 dark:text-green-200">{statsLoading ? "..." : (userStats?.activeUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-200/80 dark:text-green-300/80">Currently active</p>
                </div>
                <div className="p-3 bg-green-500/30 dark:bg-green-500/20 rounded-lg border border-green-400/30 dark:border-green-400/20 shadow-lg flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-200 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-200 dark:text-red-300">Suspended</p>
                  <p className="text-3xl font-bold text-red-100 dark:text-red-200">{statsLoading ? "..." : (userStats?.suspendedUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-200/80 dark:text-red-300/80">Account suspended</p>
                </div>
                <div className="p-3 bg-red-500/30 dark:bg-red-500/20 rounded-lg border border-red-400/30 dark:border-red-400/20 shadow-lg flex-shrink-0">
                  <Ban className="h-8 w-8 text-red-200 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-200 dark:text-amber-300">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-100 dark:text-amber-200">{statsLoading ? "..." : (userStats?.pendingReviewUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-amber-200/80 dark:text-amber-300/80">Awaiting verification</p>
                </div>
                <div className="p-3 bg-amber-500/30 dark:bg-amber-500/20 rounded-lg border border-amber-400/30 dark:border-amber-400/20 shadow-lg flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-amber-200 dark:text-amber-300" />
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
                    <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                      <TableCell className="px-3 sm:px-6 py-4">
                        <div className="flex flex-row flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user._id, "view", user.full_name || "User")}
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View User</span>
                          </Button>
                          {/* Removed Edit User - admins can view but not edit */}
                          {(user.verification_status === "pending") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user._id, "view_verification", user.full_name || "User")}
                                className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              >
                                <BadgeCheck className="h-4 w-4" />
                                <span className="sr-only">Review Verification</span>
                              </Button>
                            </>
                          )}
                          {user.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user._id, "suspend", user.full_name || "User")}
                              className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Ban className="h-4 w-4" />
                              <span className="sr-only">Suspend User</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user._id, "activate", user.full_name || "User")}
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

      {/* View User Modal */}
      <Dialog open={viewUserOpen} onOpenChange={setViewUserOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View User Details</DialogTitle>
            <DialogDescription>Complete user information</DialogDescription>
          </DialogHeader>
          {viewUserLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xl">
                    {selectedUser.full_name ? selectedUser.full_name.split(" ").map((n: string) => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedUser.verified ? (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not Verified</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">{selectedUser.status || "active"}</Badge>
                    <Badge variant="outline" className="capitalize">{selectedUser.role || "member"}</Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Trust Score
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.trust_score > 0 ? `${selectedUser.trust_score}/5` : "New User"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Last Active</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
              {selectedUser.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Bio</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedUser.bio}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No user data available</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Review Modal */}
      <Dialog open={verifyUserOpen} onOpenChange={setVerifyUserOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>Review user verification documents and details</DialogDescription>
          </DialogHeader>
          {verifyUserLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {selectedUser.full_name ? selectedUser.full_name.split(" ").map((n: string) => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline" className="mt-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    <Clock3 className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                </div>
              </div>
              <Separator />
              {selectedUser.verification_message && (
                <div>
                  <p className="text-sm font-medium mb-2">Verification Message</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted rounded-lg">
                    {selectedUser.verification_message}
                  </p>
                </div>
              )}
              {selectedUser.verification_documents && selectedUser.verification_documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Verification Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUser.verification_documents.map((doc: string, idx: number) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium truncate">Document {idx + 1}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedUser.verification_requested_at && (
                <div>
                  <p className="text-sm font-medium mb-1">Requested At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.verification_requested_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No user data available</p>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedUser) {
                  handleUserAction(selectedUser._id, "reject_verification", selectedUser.full_name || "User")
                }
                setVerifyUserOpen(false)
              }}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUserAction(selectedUser._id, "approve_verification", selectedUser.full_name || "User")
                }
                setVerifyUserOpen(false)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Actions */}
      <AlertDialog open={confirmAction.open} onOpenChange={(open) => !open && setConfirmAction({ open: false, userId: '', action: '', userName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.action === 'suspend' && `Are you sure you want to suspend "${confirmAction.userName}"? They will not be able to access their account.`}
              {confirmAction.action === 'activate' && `Are you sure you want to activate "${confirmAction.userName}"?`}
              {confirmAction.action === 'ban' && `Are you sure you want to ban "${confirmAction.userName}"? This action is permanent.`}
              {confirmAction.action === 'approve_verification' && `Are you sure you want to approve verification for "${confirmAction.userName}"?`}
              {confirmAction.action === 'reject_verification' && `Are you sure you want to reject verification for "${confirmAction.userName}"?`}
              {confirmAction.action === 'verify' && `Are you sure you want to verify "${confirmAction.userName}"?`}
              {confirmAction.action === 'unverify' && `Are you sure you want to unverify "${confirmAction.userName}"?`}
              {!['suspend', 'activate', 'ban', 'approve_verification', 'reject_verification', 'verify', 'unverify'].includes(confirmAction.action) && 
                `Are you sure you want to perform this action on "${confirmAction.userName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmAction.action === 'suspend' || confirmAction.action === 'ban' || confirmAction.action === 'reject_verification'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
