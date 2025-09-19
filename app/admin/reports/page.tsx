"use client"

import { useState } from "react"
import { ArrowLeft, AlertTriangle, Eye, CheckCircle, X, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

// Mock reports data
const reports = [
  {
    id: 1,
    type: "inappropriate_content",
    status: "pending",
    priority: "high",
    reportedBy: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?key=sj123",
    },
    reportedUser: {
      name: "Mike Problem",
      avatar: "/placeholder.svg?key=mp456",
    },
    content: {
      type: "forum_post",
      title: "Inappropriate language in farming discussion",
      excerpt: "This post contains offensive language and personal attacks...",
    },
    reason: "Inappropriate language and harassment",
    description: "User is using offensive language and making personal attacks against other community members.",
    createdAt: "2 hours ago",
    evidence: ["Screenshot of offensive post", "Multiple user complaints"],
  },
  {
    id: 2,
    type: "spam",
    status: "pending",
    priority: "medium",
    reportedBy: {
      name: "John Farmer",
      avatar: "/placeholder.svg?key=jf789",
    },
    reportedUser: {
      name: "Spam Account",
      avatar: "/placeholder.svg?key=sa012",
    },
    content: {
      type: "marketplace_listing",
      title: "Suspicious product listing",
      excerpt: "Multiple identical listings with unrealistic prices...",
    },
    reason: "Spam and fake listings",
    description: "User is posting multiple fake listings with unrealistic prices and duplicate content.",
    createdAt: "5 hours ago",
    evidence: ["Multiple duplicate listings", "Unrealistic pricing"],
  },
  {
    id: 3,
    type: "fraud",
    status: "resolved",
    priority: "high",
    reportedBy: {
      name: "Lisa Market",
      avatar: "/placeholder.svg?key=lm345",
    },
    reportedUser: {
      name: "Fake Seller",
      avatar: "/placeholder.svg?key=fs678",
    },
    content: {
      type: "marketplace_transaction",
      title: "Fraudulent transaction",
      excerpt: "Seller took payment but never delivered products...",
    },
    reason: "Fraudulent activity",
    description: "Seller accepted payment for organic vegetables but never delivered the products.",
    createdAt: "1 day ago",
    evidence: ["Payment records", "No delivery confirmation", "Multiple complaints"],
    resolution: "User account suspended and refund processed",
  },
]

const reportTypes = {
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  fraud: "Fraud",
  harassment: "Harassment",
  fake_profile: "Fake Profile",
}

const priorityColors = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<(typeof reports)[0] | null>(null)

  const filteredReports = reports.filter(
    (report) =>
      (statusFilter === "all" || report.status === statusFilter) &&
      (priorityFilter === "all" || report.priority === priorityFilter),
  )

  const handleReportAction = (reportId: number, action: string, resolution?: string) => {
    console.log(`Action ${action} for report ${reportId}`, resolution)
    setSelectedReport(null)
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
              <h1 className="text-2xl font-bold text-foreground font-sans">User Reports</h1>
              <p className="text-muted-foreground">Review and handle user-reported content</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{reports.filter((r) => r.status === "pending").length} pending</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <Flag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.status === "pending").length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.status === "resolved").length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.priority === "high").length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={report.reportedUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{report.reportedUser.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{report.content.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Reported user: <span className="font-medium">{report.reportedUser.name}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reported by: <span className="font-medium">{report.reportedBy.name}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityColors[report.priority as keyof typeof priorityColors]}>
                          {report.priority}
                        </Badge>
                        <Badge variant={report.status === "resolved" ? "default" : "secondary"}>{report.status}</Badge>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Reason: {report.reason}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {reportTypes[report.type as keyof typeof reportTypes]}</span>
                        <span>•</span>
                        <span>{report.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Report Details</DialogTitle>
                            </DialogHeader>
                            {selectedReport && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Reported Content</h4>
                                  <p className="text-sm text-muted-foreground">{selectedReport.content.excerpt}</p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Evidence</h4>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {selectedReport.evidence.map((item, index) => (
                                      <li key={index}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>

                                {selectedReport.status === "resolved" && selectedReport.resolution && (
                                  <div>
                                    <h4 className="font-medium mb-2">Resolution</h4>
                                    <p className="text-sm text-muted-foreground">{selectedReport.resolution}</p>
                                  </div>
                                )}

                                {selectedReport.status === "pending" && (
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Resolution Notes</h4>
                                      <Textarea placeholder="Add resolution notes..." rows={3} />
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleReportAction(selectedReport.id, "resolve")}
                                        className="flex-1"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Resolve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleReportAction(selectedReport.id, "dismiss")}
                                        className="flex-1"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Dismiss
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleReportAction(report.id, "resolve")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReportAction(report.id, "dismiss")}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
