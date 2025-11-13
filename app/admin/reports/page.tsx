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

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const priorityColors: Record<string, BadgeVariant> = {
  high: "destructive",
  medium: "secondary", 
  low: "outline",
}

const statusColors: Record<string, BadgeVariant> = {
  pending: "secondary",
  resolved: "default",
  dismissed: "outline",
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
                        <Badge variant={(priorityColors[report.priority as keyof typeof priorityColors] || 'secondary') as BadgeVariant}>
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
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="pb-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <DialogTitle className="text-2xl font-bold text-gray-900">Report Details</DialogTitle>
                                  <p className="text-sm text-gray-500 mt-1">Review and manage this report</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={(statusColors[selectedReport?.status as keyof typeof statusColors] || 'outline') as BadgeVariant}
                                    className="px-3 py-1 text-sm font-medium"
                                  >
                                    {selectedReport?.status || 'Unknown'}
                                  </Badge>
                                  <Badge 
                                    variant={(priorityColors[selectedReport?.priority as keyof typeof priorityColors] || 'secondary') as BadgeVariant}
                                    className="px-3 py-1 text-sm font-medium"
                                  >
                                    {selectedReport?.priority || 'Unknown'} Priority
                                  </Badge>
                                </div>
                              </div>
                            </DialogHeader>
                            {selectedReport && (
                              <div className="space-y-6">
                                {/* Reporter Information */}
                                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                                  <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                                        <AvatarImage src={selectedReport.reporter?.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                          {(selectedReport.reporter?.full_name || 'U')[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                          {selectedReport.reporter?.full_name || 'Unknown User'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">{selectedReport.reporter?.email || 'No email provided'}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-white/80">
                                            {selectedReport.reporter?.role || 'user'}
                                          </Badge>
                                          <span className="text-xs text-gray-500">•</span>
                                          <span className="text-xs text-gray-500">Reporter</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Report Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Flag className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-semibold text-gray-900">Type</h4>
                                      </div>
                                      <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                                        {selectedReport.type || 'Unknown'}
                                      </Badge>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                                        <h4 className="font-semibold text-gray-900">Priority</h4>
                                      </div>
                                      <Badge 
                                        variant={(priorityColors[selectedReport.priority as keyof typeof priorityColors] || 'secondary') as BadgeVariant}
                                        className="px-3 py-1 text-sm font-medium"
                                      >
                                        {selectedReport.priority || 'Unknown'}
                                      </Badge>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <h4 className="font-semibold text-gray-900">Created</h4>
                                      </div>
                                      <p className="text-sm text-gray-600 font-medium">{selectedReport.createdAt}</p>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Reason */}
                                <Card className="border-0 shadow-sm">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      Reason
                                    </h4>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                      <p className="text-sm text-red-800 font-medium">{selectedReport.reason || 'No reason provided'}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Description */}
                                <Card className="border-0 shadow-sm">
                                  <CardContent className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-gray-600" />
                                      Description
                                    </h4>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {selectedReport.description || 'No description provided'}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Content ID */}
                                {selectedReport.content_id && (
                                  <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-gray-600">#</span>
                                        Content ID
                                      </h4>
                                      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                                        <code className="text-xs text-gray-600 font-mono break-all">
                                          {selectedReport.content_id}
                                        </code>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Admin Notes */}
                                {selectedReport.admin_notes && (
                                  <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50">
                                    <CardContent className="p-4">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-amber-600">📝</span>
                                        Admin Notes
                                      </h4>
                                      <div className="bg-white/80 border border-amber-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {selectedReport.admin_notes}
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Action Section */}
                                {selectedReport.status === "pending" && (
                                  <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-slate-50">
                                    <CardContent className="p-6">
                                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="text-blue-600">⚡</span>
                                        Resolution Actions
                                      </h4>
                                      
                                      <div className="space-y-4">
                                        <div>
                                          <label htmlFor="resolution-notes" className="block text-sm font-medium text-gray-700 mb-2">
                                            Resolution Notes
                                          </label>
                                          <Textarea 
                                            id="resolution-notes" 
                                            placeholder="Add your resolution notes here..." 
                                            rows={3}
                                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                          />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                          <Button
                                            onClick={() => {
                                              const notes = (document.getElementById('resolution-notes') as HTMLTextAreaElement)?.value
                                              handleReportAction(selectedReport._id || selectedReport.id, "resolve", notes)
                                            }}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                          >
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Resolve & Delete Content
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              const notes = (document.getElementById('resolution-notes') as HTMLTextAreaElement)?.value
                                              handleReportAction(selectedReport._id || selectedReport.id, "dismiss", notes)
                                            }}
                                            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                          >
                                            <X className="h-5 w-5 mr-2" />
                                            Dismiss (Keep Content)
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
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
