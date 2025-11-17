"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  Users,
  AlertTriangle,
  CheckCircle,
  Pin,
  Lock,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAdminCommunity } from "@/hooks/use-admin-data"
import { authFetch } from "@/lib/auth-client"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

export default function CommunityContentPage() {
  const { threads, stats, loading } = useAdminCommunity()
  const [categories, setCategories] = useState<any[]>([])
  const [viewPostOpen, setViewPostOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [viewPostLoading, setViewPostLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; postId: string; action: string; title: string }>({ open: false, postId: '', action: '', title: '' })
  
  const posts = threads.map((t: any) => ({
    id: String(t._id),
    title: t.title,
    author: t.author_id?.full_name || 'Unknown',
    category: t.category || t.category_id?.name || 'General',
    replies: t.replies_count || 0,
    views: t.views || 0,
    likes: t.likes_count || 0,
    status: t.status || 'active',
    pinned: !!t.pinned,
    flagged: !!t.flagged,
    createdAt: t.created_at ? new Date(t.created_at).toLocaleDateString() : '',
    lastActivity: t.last_activity ? new Date(t.last_activity).toLocaleDateString() : '',
  }))

  const handleViewPost = async (postId: string) => {
    setViewPostLoading(true)
    setViewPostOpen(true)
    try {
      const res = await authFetch(`/api/community/threads/${postId}`)
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setSelectedPost(json?.data || json)
      } else {
        toast.error('Failed to load post details')
        setViewPostOpen(false)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load post')
      setViewPostOpen(false)
    } finally {
      setViewPostLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    try {
      const res = await authFetch(`/api/admin/community/threads/${confirmAction.postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmAction.action })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || 'Failed')
      toast.success('Action completed successfully')
      setConfirmAction({ open: false, postId: '', action: '', title: '' })
      // Refresh the page to show updated data
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message || 'Failed to perform action')
    }
  }

  const doThreadAction = async (id: string, action: string, title: string) => {
    // Show confirmation modal instead of directly executing
    setConfirmAction({ open: true, postId: id, action, title })
  }

  useEffect(() => {
    const run = async () => {
      try {
        const res = await authFetch('/api/community/categories')
        const json = await res.json().catch(() => ({}))
        const cats = json?.data?.categories || json?.categories || []
        // normalize shape: { name, posts }
        const normalized = Array.isArray(cats) ? cats.map((c: any) => ({
          name: c.name || c._id || 'Category',
          posts: c.count || c.posts_count || 0,
          color: 'bg-gray-100 text-gray-800',
        })) : []
        setCategories(normalized)
      } catch {
        setCategories([])
      }
    }
    run()
  }, [])

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-200 dark:text-blue-300">Total Posts</p>
                <p className="text-3xl font-bold text-blue-100 dark:text-blue-200">{((stats as any)?.total || 0).toLocaleString()}</p>
                <p className="text-xs text-blue-200/80 dark:text-blue-300/80">All community posts</p>
              </div>
              <div className="p-3 bg-blue-500/30 dark:bg-blue-500/20 rounded-lg border border-blue-400/30 dark:border-blue-400/20 shadow-lg flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-blue-200 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-700 dark:to-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-200 dark:text-green-300">Active Posts</p>
                <p className="text-3xl font-bold text-green-100 dark:text-green-200">{((stats as any)?.active || 0).toLocaleString()}</p>
                <p className="text-xs text-green-200/80 dark:text-green-300/80">Currently visible</p>
              </div>
              <div className="p-3 bg-green-500/30 dark:bg-green-500/20 rounded-lg border border-green-400/30 dark:border-green-400/20 shadow-lg flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-200 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-200 dark:text-amber-300">Pending Review</p>
                <p className="text-3xl font-bold text-amber-100 dark:text-amber-200">{(stats as any)?.pending || 0}</p>
                <p className="text-xs text-amber-200/80 dark:text-amber-300/80">Awaiting moderation</p>
              </div>
              <div className="p-3 bg-amber-500/30 dark:bg-amber-500/20 rounded-lg border border-amber-400/30 dark:border-amber-400/20 shadow-lg flex-shrink-0">
                <Users className="h-8 w-8 text-amber-200 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-200 dark:text-red-300">Flagged Posts</p>
                <p className="text-3xl font-bold text-red-100 dark:text-red-200">{(stats as any)?.flagged || 0}</p>
                <p className="text-xs text-red-200/80 dark:text-red-300/80">Need attention</p>
              </div>
              <div className="p-3 bg-red-500/30 dark:bg-red-500/20 rounded-lg border border-red-400/30 dark:border-red-400/20 shadow-lg flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-200 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Post Management</h1>
            <p className="text-muted-foreground">Search, filter, and moderate community posts</p>
          </div>

          {/* Filters and Search */}
          <Card className="border-2 border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search posts, authors, or content..." 
                    className="pl-12 h-12 border-2 border-border focus:border-primary rounded-xl bg-background transition-all duration-200" 
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 px-6 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" className="h-12 px-6 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card className="border-2 border-border shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader className="bg-muted/50 backdrop-blur-sm sticky top-0 z-10">
                    <TableRow className="border-b-2 border-border hover:bg-transparent">
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[250px]">Post</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[150px]">Author</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[120px]">Category</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[140px]">Engagement</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[100px]">Status</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-foreground uppercase tracking-wider text-xs min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                            <p className="text-sm text-muted-foreground">Loading posts...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : posts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm font-medium text-foreground">No posts found</p>
                          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.map((post) => (
                        <TableRow key={post.id} className="hover:bg-muted/50 transition-all duration-200 border-b border-border group">
                          <TableCell className="px-6 py-4 min-w-[250px]">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1.5 pt-0.5">
                                {post.pinned && <Pin className="h-4 w-4 text-blue-500 fill-blue-500" />}
                                {post.flagged && <AlertTriangle className="h-4 w-4 text-red-500 fill-red-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground line-clamp-2 mb-1">{post.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  Created {post.createdAt} • Last activity {post.lastActivity}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 min-w-[150px]">
                            <div className="font-medium text-foreground">{post.author}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 min-w-[120px]">
                            <Badge variant="outline" className="border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50">
                              {post.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 min-w-[140px]">
                            <div className="space-y-1 text-sm">
                              <div className="text-foreground">
                                <span className="text-muted-foreground">Replies:</span> <span className="font-medium">{post.replies}</span>
                              </div>
                              <div className="text-foreground">
                                <span className="text-muted-foreground">Views:</span> <span className="font-medium">{post.views}</span>
                              </div>
                              <div className="text-foreground">
                                <span className="text-muted-foreground">Likes:</span> <span className="font-medium">{post.likes}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 min-w-[100px]">
                            <div className="flex flex-col gap-1.5">
                              <Badge
                                className={
                                  (post.status === "active"
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                                    : post.status === "pending"
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800") +
                                  " border-2 capitalize w-fit"
                                }
                                variant="outline"
                              >
                                {post.status}
                              </Badge>
                              {post.pinned && (
                                <Badge variant="outline" className="text-xs w-fit border-2">
                                  Pinned
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 min-w-[80px]">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewPost(post.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Post
                                </DropdownMenuItem>
                                {/* Removed Edit Post - admins can view but not edit */}
                                <DropdownMenuItem onClick={() => doThreadAction(post.id, post.pinned ? 'unpin' : 'pin', post.title)}>
                                  <Pin className="mr-2 h-4 w-4" />
                                  {post.pinned ? "Unpin" : "Pin"} Post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => doThreadAction(post.id, 'lock', post.title)}>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Lock Thread
                                </DropdownMenuItem>
                                {post.status === "pending" && (
                                  <DropdownMenuItem onClick={() => doThreadAction(post.id, 'approve', post.title)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => doThreadAction(post.id, 'delete', post.title)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Categories
              </CardTitle>
              <CardDescription className="mt-1">Post distribution by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No categories found</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border-2 border-border bg-card hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    <Badge variant="secondary" className="border-2 border-border">
                      {category.posts}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-11 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors"
              >
                <Pin className="mr-2 h-4 w-4" />
                Manage Pinned Posts
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-11 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Flagged Content
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-11 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors"
              >
                <Users className="mr-2 h-4 w-4" />
                Moderate Users
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-11 border-2 border-border hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Community Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Post Modal */}
      <Dialog open={viewPostOpen} onOpenChange={setViewPostOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Post Details</DialogTitle>
            <DialogDescription>View complete post information</DialogDescription>
          </DialogHeader>
          {viewPostLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedPost ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedPost.title || 'No title'}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>Author: {selectedPost.author?.name || selectedPost.author_id?.full_name || 'Unknown'}</span>
                  <span>•</span>
                  <span>Created: {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedPost.content || selectedPost.description || 'No content'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant="outline">{selectedPost.status || 'active'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Category</p>
                  <Badge variant="outline">{selectedPost.category || 'General'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Views</p>
                  <p className="text-sm">{selectedPost.views || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Likes</p>
                  <p className="text-sm">{selectedPost.likes_count || selectedPost.likes || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Replies</p>
                  <p className="text-sm">{selectedPost.replies_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Pinned</p>
                  <Badge variant={selectedPost.pinned ? "default" : "outline"}>
                    {selectedPost.pinned ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No post data available</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPostOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Actions */}
      <AlertDialog open={confirmAction.open} onOpenChange={(open) => !open && setConfirmAction({ open: false, postId: '', action: '', title: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.action === 'delete' && `Are you sure you want to delete "${confirmAction.title}"? This action cannot be undone.`}
              {confirmAction.action === 'pin' && `Are you sure you want to pin "${confirmAction.title}"?`}
              {confirmAction.action === 'unpin' && `Are you sure you want to unpin "${confirmAction.title}"?`}
              {confirmAction.action === 'lock' && `Are you sure you want to lock "${confirmAction.title}"? Users will not be able to reply.`}
              {confirmAction.action === 'approve' && `Are you sure you want to approve "${confirmAction.title}"?`}
              {!['delete', 'pin', 'unpin', 'lock', 'approve'].includes(confirmAction.action) && `Are you sure you want to perform this action on "${confirmAction.title}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
