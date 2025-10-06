"use client"

import { useState } from "react"
import { ArrowLeft, AlertTriangle, Eye, CheckCircle, X, Flag, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { toast } from "sonner"
import { useAdminReports, adminReportAction } from "@/hooks/use-admin-data"

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ reportId: string; action: string; resolution?: string } | null>(null)
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

  // Filter reports based on search query
  const filteredReports = reports.filter((report: any) => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      report.reporter?.full_name?.toLowerCase().includes(searchLower) ||
      report.reporter?.email?.toLowerCase().includes(searchLower) ||
      report.type?.toLowerCase().includes(searchLower) ||
      report.reason?.toLowerCase().includes(searchLower) ||
      report.description?.toLowerCase().includes(searchLower) ||
      report.status?.toLowerCase().includes(searchLower) ||
      report.priority?.toLowerCase().includes(searchLower)
    )
  })

  const handleReportAction = (reportId: string, action: string, resolution?: string) => {
    const mapped = action === 'resolve' || action === 'dismiss' ? action : null
    if (!mapped) return toast.info('Unsupported action')
    
    // Show confirmation dialog for both resolve and dismiss actions
    setPendingAction({ reportId, action, resolution })
    setShowConfirmDialog(true)
  }

  const executeReportAction = async (reportId: string, action: string, resolution?: string) => {
    try {
      await adminReportAction(reportId, action as any, resolution)
      toast.success(action === 'resolve' ? 'Content deleted and report resolved' : 'Report dismissed')
      setSelectedReport(null)
      setShowConfirmDialog(false)
      setPendingAction(null)
      window.location.reload() // Refresh to update the table
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
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

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
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Reporter</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Type</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Reason</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Description</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Priority</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Status</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Created</th>
                    <th className="p-4 text-left text-sm font-medium bg-muted/50">Actions</th>
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
                                    {/* Reporter Information */}
                                    <div>
                                      <h4 className="font-medium mb-2">Reporter</h4>
                                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={selectedReport.reporter?.avatar_url || "/placeholder.svg"} />
                                          <AvatarFallback>{(selectedReport.reporter?.full_name || 'U')[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">{selectedReport.reporter?.full_name || 'Unknown'}</p>
                                          <p className="text-xs text-muted-foreground">{selectedReport.reporter?.email || ''}</p>
                                          <Badge variant="outline" className="text-xs mt-1">{selectedReport.reporter?.role || 'user'}</Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Report Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Type</h4>
                                        <Badge variant="outline">{selectedReport.type}</Badge>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Priority</h4>
                                        <Badge variant={priorityColors[selectedReport.priority as keyof typeof priorityColors] || 'secondary'}>
                                          {selectedReport.priority}
                                        </Badge>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Status</h4>
                                        <Badge variant={selectedReport.status === "resolved" ? "default" : selectedReport.status === "pending" ? "secondary" : "outline"}>
                                          {selectedReport.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Created</h4>
                                        <p className="text-sm text-muted-foreground">{selectedReport.createdAt}</p>
                                      </div>
                                    </div>

                                    {/* Reason */}
                                <div>
                                      <h4 className="font-medium mb-2">Reason</h4>
                                      <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
                                </div>

                                    {/* Description */}
                                <div>
                                      <h4 className="font-medium mb-2">Description</h4>
                                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">{selectedReport.description}</p>
                                </div>

                                    {/* Content ID (if needed) */}
                                    {selectedReport.content_id && (
                                      <div>
                                        <h4 className="font-medium mb-2">Content ID</h4>
                                        <p className="text-xs text-muted-foreground font-mono">{selectedReport.content_id}</p>
                                      </div>
                                    )}

                                    {selectedReport.admin_notes && (
                                  <div>
                                        <h4 className="font-medium mb-2">Admin Notes</h4>
                                        <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">{selectedReport.admin_notes}</p>
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
                                            className="flex-1 bg-red-600 hover:bg-red-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                            Resolve & Delete Content
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
                                            Dismiss (Keep Content)
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
                                  className="bg-red-600 hover:bg-red-700"
                                  title="Delete content and resolve report"
                            >
                                  <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                                  onClick={() => handleReportAction(report._id || report.id, "dismiss")}
                                  title="Dismiss report without deleting content"
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction?.action === 'resolve' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">Delete Content?</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-600">Dismiss Report?</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingAction?.action === 'resolve' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  This action will <span className="font-semibold text-foreground">permanently delete</span> the reported content from the database.
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    ⚠️ This action cannot be undone!
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this content and resolve the report?
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This will mark the report as <span className="font-semibold text-foreground">dismissed</span> without deleting the reported content.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    ℹ️ The reported content will remain visible to users.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to dismiss this report?
                </p>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
                setPendingAction(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingAction) {
                  executeReportAction(pendingAction.reportId, pendingAction.action, pendingAction.resolution)
                }
              }}
              className={`flex-1 ${
                pendingAction?.action === 'resolve' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {pendingAction?.action === 'resolve' ? 'Delete Content' : 'Dismiss Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
