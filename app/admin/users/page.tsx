"use client"

import { useState } from "react"
import { ArrowLeft, Search, MoreHorizontal, Shield, Ban, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

// Mock user data
const users = [
  {
    id: 1,
    name: "John Farmer",
    email: "john@example.com",
    role: "Worker",
    status: "active",
    trustScore: 4.8,
    joinDate: "2023-01-15",
    lastActive: "2 hours ago",
    avatar: "/placeholder.svg?key=jf123",
    verified: true,
    reports: 0,
  },
  {
    id: 2,
    name: "Sarah Market",
    email: "sarah@example.com",
    role: "Buyer",
    status: "active",
    trustScore: 4.6,
    joinDate: "2023-02-20",
    lastActive: "1 day ago",
    avatar: "/placeholder.svg?key=sm456",
    verified: true,
    reports: 0,
  },
  {
    id: 3,
    name: "Mike Recruiter",
    email: "mike@example.com",
    role: "Recruiter",
    status: "suspended",
    trustScore: 3.2,
    joinDate: "2023-03-10",
    lastActive: "1 week ago",
    avatar: "/placeholder.svg?key=mr789",
    verified: false,
    reports: 3,
  },
  {
    id: 4,
    name: "Lisa Green",
    email: "lisa@example.com",
    role: "Worker",
    status: "pending",
    trustScore: 0,
    joinDate: "2024-01-08",
    lastActive: "5 minutes ago",
    avatar: "/placeholder.svg?key=lg012",
    verified: false,
    reports: 0,
  },
]

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

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || user.status === statusFilter) &&
      (roleFilter === "all" || user.role === roleFilter),
  )

  const handleUserAction = (userId: number, action: string) => {
    console.log(`Action ${action} for user ${userId}`)
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">2,847</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">2,756</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold">67</p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Worker">Workers</SelectItem>
                  <SelectItem value="Recruiter">Recruiters</SelectItem>
                  <SelectItem value="Buyer">Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.verified && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${statusColors[user.status as keyof typeof statusColors]}`}
                        />
                        <span className="capitalize">{user.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.trustScore > 0 ? (
                        <div className="flex items-center gap-1">
                          <span>{user.trustScore}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">New</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                    <TableCell>
                      {user.reports > 0 ? (
                        <Badge variant="destructive">{user.reports}</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "view")}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "verify")}>
                            {user.verified ? "Remove Verification" : "Verify User"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                            {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, "ban")}
                            className="text-destructive"
                          >
                            Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
