"use client"

import { useState } from "react"
import { ArrowLeft, Search, MoreHorizontal, Shield, Ban, CheckCircle, AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

  const { users, loading, error } = useAdminUsers({
    status: statusFilter,
    role: roleFilter,
    search: searchTerm,
  })
  const { stats: userStats, loading: statsLoading } = useAdminUserStats()

  const filteredUsers = users

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const mapped = action === 'verify' || action === 'unverify' || action === 'suspend' || action === 'unsuspend' || action === 'ban' ? action : null
      if (!mapped) return toast.info('Unsupported action')
      await adminUserAction(userId, mapped as any)
      toast.success('Updated')
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900">{statsLoading ? "..." : (userStats?.totalUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-blue-500">All registered users</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-900">{statsLoading ? "..." : (userStats?.activeUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-500">Currently active</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600">Suspended</p>
                  <p className="text-3xl font-bold text-red-900">{statsLoading ? "..." : (userStats?.suspendedUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-500">Account suspended</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <Ban className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-600">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-900">{statsLoading ? "..." : (userStats?.pendingReviewUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-amber-500">Awaiting verification</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-8 border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-200"
                />
              </div>

              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-200">
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
                  <SelectTrigger className="w-48 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-200">
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
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800">Users ({filteredUsers.length})</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage and monitor user accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  System Healthy
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Table className="min-w-full">
                <TableHeader className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <TableRow className="border-b-2 border-gray-200 hover:bg-transparent">
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[300px]">User</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[120px]">Role</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[100px]">Status</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[120px]">Trust Score</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[120px]">Last Active</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[100px]">Reports</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs min-w-[100px]">Actions</TableHead>
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
                    <TableRow key={user._id} className="hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 group">
                      <TableCell className="px-6 py-4 min-w-[300px]">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
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
                          <p className="font-semibold text-gray-900 truncate">{user.full_name || "User"}</p>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.verified ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
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
                          buyer: { label: "Trader", class: "bg-blue-100 text-blue-800 border-blue-200", icon: "🛒" },
                          recruiter: { label: "Employer", class: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "🏢" },
                          worker: { label: "Member", class: "bg-amber-100 text-amber-800 border-amber-200", icon: "👤" },
                          admin: { label: "Admin", class: "bg-purple-100 text-purple-800 border-purple-200", icon: "👑" }
                        }
                        const config = roleConfig[r as keyof typeof roleConfig] || { label: "User", class: "bg-gray-100 text-gray-800 border-gray-200", icon: "👤" }
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
                        <span className="font-medium capitalize text-gray-700">{user.status}</span>
                      </div>
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[120px]">
                        {user.trust_score > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < user.trust_score ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{user.trust_score}/5</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 min-w-[120px] text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                    </TableCell>
                      <TableCell className="px-6 py-4 min-w-[100px]">
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                          -
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 min-w-[100px]">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleUserAction(user._id, "view")}>
                            <Search className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user._id, "edit")}>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user._id, "suspend")}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user._id, "activate")}
                              className="text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
