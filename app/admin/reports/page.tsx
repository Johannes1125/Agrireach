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
import { toast } from "sonner"
import { useAdminReports, adminReportAction } from "@/hooks/use-admin-data"

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const { reports, loading, error } = useAdminReports({ status: statusFilter, priority: priorityFilter })

  console.log('Reports in component:', reports, 'Loading:', loading, 'Error:', error)

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

  const filteredReports = reports

  const handleReportAction = async (reportId: string, action: string, resolution?: string) => {
    try {
      const mapped = action === 'resolve' || action === 'dismiss' ? action : null
      if (!mapped) return toast.info('Unsupported action')
      await adminReportAction(reportId, mapped as any, resolution)
      toast.success('Report updated')
      setSelectedReport(null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update report')
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
              <h1 className="text-2xl font-bold text-foreground font-sans">User Reports</h1>
              <p className="text-muted-foreground">Review and handle user-reported content</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{reports.filter((r: any) => r.status === "pending").length} pending</Badge>
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
                  <p className="text-2xl font-bold">{reports.filter((r: any) => r.status === "pending").length}</p>
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
                  <p className="text-2xl font-bold">{reports.filter((r: any) => r.status === "resolved").length}</p>
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
                  <p className="text-2xl font-bold">{reports.filter((r: any) => r.priority === "high").length}</p>
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

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Reporter</th>
                    <th className="p-4 text-left text-sm font-medium">Type</th>
                    <th className="p-4 text-left text-sm font-medium">Reason</th>
                    <th className="p-4 text-left text-sm font-medium">Description</th>
                    <th className="p-4 text-left text-sm font-medium">Priority</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Created</th>
                    <th className="p-4 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Loading reports...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report: any) => (
                      <tr key={report._id || report.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.reporter?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{(report.reporter?.full_name || 'U')[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{report.reporter?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate">{report.reporter?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{report.reason}</span>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-sm text-muted-foreground truncate" title={report.description}>
                            {report.description}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge variant={priorityColors[report.priority as keyof typeof priorityColors] || 'secondary'}>
                            {report.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={report.status === "resolved" ? "default" : report.status === "pending" ? "secondary" : "outline"}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-muted-foreground">
                            {report.createdAt}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Report Details</DialogTitle>
                                </DialogHeader>
                                {selectedReport && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Report ID</h4>
                                        <p className="text-sm text-muted-foreground">{selectedReport._id || selectedReport.id}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Content ID</h4>
                                        <p className="text-sm text-muted-foreground">{selectedReport.content_id || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Full Description</h4>
                                      <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                                    </div>

                                    {selectedReport.admin_notes && (
                                      <div>
                                        <h4 className="font-medium mb-2">Admin Notes</h4>
                                        <p className="text-sm text-muted-foreground">{selectedReport.admin_notes}</p>
                                      </div>
                                    )}

                                    {selectedReport.status === "pending" && (
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="font-medium mb-2">Resolution Notes</h4>
                                          <Textarea id="resolution-notes" placeholder="Add resolution notes..." rows={3} />
                                        </div>

                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => {
                                              const notes = (document.getElementById('resolution-notes') as HTMLTextAreaElement)?.value
                                              handleReportAction(selectedReport._id || selectedReport.id, "resolve", notes)
                                            }}
                                            className="flex-1"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Resolve
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              const notes = (document.getElementById('resolution-notes') as HTMLTextAreaElement)?.value
                                              handleReportAction(selectedReport._id || selectedReport.id, "dismiss", notes)
                                            }}
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
                                  onClick={() => handleReportAction(report._id || report.id, "resolve")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReportAction(report._id || report.id, "dismiss")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
