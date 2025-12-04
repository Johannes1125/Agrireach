"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/components/notifications/notification-provider"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useRecruiterData } from "@/hooks/use-recruiter-data"
import { useBuyerData } from "@/hooks/use-buyer-data"
import { useOrdersData } from "@/hooks/use-orders-data"
import { useFeaturedProductsData } from "@/hooks/use-featured-products-data"
import { ManageJobModal } from "@/components/dashboard/manage-job-modal"
import { ManageProductModal } from "@/components/marketplace/manage-product-modal"
import { OrderTrackingModal } from "@/components/marketplace/order-tracking-modal"
import { DeliveryManagementModal } from "@/components/marketplace/delivery-management-modal"
import { formatDate, formatRelativeTime, cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/auth-client"
import {
  Briefcase,
  Star,
  MapPin,
  Calendar,
  Award,
  Clock,
  Users,
  Eye,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Plus,
  ShoppingCart,
  Package,
  Truck,
} from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
  joinDate: string
}

interface UnifiedDashboardProps {
  user: User
}

export function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  const [activeRole, setActiveRole] = useState(user.role || "worker")
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [manageProductModalOpen, setManageProductModalOpen] = useState(false)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null)
  const router = useRouter()
  const notifications = useNotifications()
  const { stats, activities, loading, error } = useDashboardData()
  const { jobs: recruiterJobs, applicants: recentApplicants, loading: recruiterLoading } = useRecruiterData()
  const { products: buyerProducts, loading: buyerLoading, refetch: refetchProducts } = useBuyerData()
  const { orders: buyerOrders, loading: buyerOrdersLoading } = useOrdersData("buyer", 5)
  const { orders: sellerOrders, loading: sellerOrdersLoading } = useOrdersData("seller", 5)
  const { products: featuredProducts, loading: featuredProductsLoading } = useFeaturedProductsData(12)
  
  // Debug featured products data
  useEffect(() => {
    console.log("Featured products in dashboard:", featuredProducts)
    console.log("Featured products loading:", featuredProductsLoading)
  }, [featuredProducts, featuredProductsLoading])

  const getWorkerData = () => {
    if (!stats?.worker) return null

    return {
      stats: {
        activeJobs: stats.worker.acceptedJobs,
        pendingApplications: stats.worker.pendingApplications,
        totalApplications: stats.worker.activeApplications,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('job') || a.type.includes('application')).slice(0, 5),
    }
  }

  const getRecruiterData = () => {
    if (!stats?.recruiter) return null

    return {
      stats: {
        activeJobs: stats.recruiter.activeJobs,
        totalApplications: stats.recruiter.totalApplications,
        pendingApplications: stats.recruiter.pendingApplications,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('job') || a.type.includes('application')).slice(0, 5),
    }
  }

  const getBuyerData = () => {
    if (!stats?.buyer) return null

    return {
      stats: {
        totalOrders: stats.buyer.totalOrders,
        pendingOrders: stats.buyer.pendingOrders,
        totalSpent: stats.buyer.totalSpent,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('order') || a.type.includes('product')).slice(0, 5),
    }
  }

  const getSellerData = () => {
    if (!stats?.seller) return null

    return {
      stats: {
        activeProducts: stats.seller.activeProducts,
        totalOrders: stats.seller.totalOrders,
        totalEarnings: stats.seller.totalEarnings,
        trustScore: stats.user.trust_score,
        verified: stats.user.verified,
      },
      recentActivities: activities.filter(a => a.type.includes('order') || a.type.includes('product')).slice(0, 5),
    }
  }

  const handleManageJob = (job: any) => {
    setSelectedJob(job)
    setManageModalOpen(true)
  }

  const handleEditJob = (jobId: string) => {
    router.push(`/opportunities/edit/${jobId}`)
  }

  const handleManageProduct = (product: any) => {
    setSelectedProduct(product)
    setManageProductModalOpen(true)
  }

  const handleEditProduct = (productId: string) => {
    router.push(`/marketplace/edit/${productId}`)
  }

  const handleDeleteProduct = async (productId: string) => {
    refetchProducts()
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/opportunities/${jobId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        notifications.showSuccess("Job Deleted", "The job posting has been removed")
        setManageModalOpen(false)
        // Refresh the page to update the job list
        window.location.reload()
      } else {
        notifications.showError("Delete Failed", "Failed to delete job posting")
      }
    } catch (error) {
      notifications.showError("Error", "An error occurred while deleting the job")
    }
  }

  // Get role-specific data
  const workerData = getWorkerData()
  const recruiterData = getRecruiterData()
  const buyerData = getBuyerData()

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "worker":
        return {
          title: "Member Dashboard",
          subtitle: "Find jobs and track your agricultural work",
          primaryAction: "Find New Jobs",
          primaryIcon: Briefcase,
        }
      case "recruiter":
        return {
          title: "Employer Dashboard",
          subtitle: "Post jobs and manage your hiring process",
          primaryAction: "Post New Job",
          primaryIcon: Plus,
        }
      case "buyer":
        return {
          title: "Trader Dashboard",
          subtitle: "Discover and purchase from local farmers",
          primaryAction: "Browse E-Commerce",
          primaryIcon: ShoppingCart,
        }
      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to AgriReach",
          primaryAction: "Get Started",
          primaryIcon: Plus,
        }
    }
  }

  const config = getRoleConfig(activeRole)
  const PrimaryIcon = config.primaryIcon

  const handleQuickAction = (action: string, role: string) => {
    switch (action) {
      case "find-jobs":
        router.push("/opportunities")
        break
      case "post-new-job":
        router.push("/opportunities/post")
        break
      case "browse-marketplace":
        router.push("/marketplace")
        break
      case "complete-profile":
        router.push("/profile")
        break
      case "view-applicants":
        router.push("/dashboard")
        break
      case "track-order":
        router.push("/marketplace")
        break
      default:
        notifications.showInfo("Action", `Performing ${action}...`)
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error loading dashboard: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header with Role Switcher */}
      <header className="flex flex-col gap-3 sm:gap-4 md:gap-6">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Welcome back, {user.name ? user.name.split(" ")[0] : "User"}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">{config.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Removed Bell Notification Button */}
            <Button
              size="lg"
              className="w-full sm:w-fit shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              onClick={() => {
                const action = config.primaryAction.toLowerCase().replace(/\s+/g, "-")
                handleQuickAction(action, activeRole)
              }}
            >
              <PrimaryIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{config.primaryAction}</span>
              <span className="sm:hidden">Browse</span>
            </Button>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit gap-1 sm:gap-2">
            <TabsTrigger value="worker" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Member</span>
            </TabsTrigger>
            <TabsTrigger value="recruiter" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Employer</span>
            </TabsTrigger>
            <TabsTrigger value="buyer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Trader</span>
            </TabsTrigger>
          </TabsList>

          {/* Worker Dashboard */}
          <TabsContent value="worker" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid */}
            <section className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Jobs</CardTitle>
                  <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-300">{stats?.worker?.acceptedJobs || 0}</div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Currently working</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Completed Jobs</CardTitle>
                  <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                    <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-300">{stats?.worker?.activeApplications || 0}</div>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">Total applications</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Trust Score</CardTitle>
                  <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-300">{stats?.user?.trust_score || 0}</div>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Your reputation</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Rating</CardTitle>
                  <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-300">{stats?.reviewsReceived || 0}</div>
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Reviews received</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              {/* Recent Jobs */}
              <section className="lg:col-span-2">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-xl sm:text-2xl">Recent Job Applications</CardTitle>
                      <CardDescription className="text-sm">
                        Track your current and pending job applications
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workerData?.recentActivities && workerData.recentActivities.length > 0 ? (
                      workerData.recentActivities.map((activity) => {
                        const getBadge = (type: string) => {
                          switch (type) {
                            case 'application_accepted':
                              return { label: 'Accepted', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600 text-white border-0' }
                            case 'application_rejected':
                              return { label: 'Rejected', variant: 'destructive' as const, className: '' }
                            case 'application_submitted':
                            default:
                              return { label: 'Submitted', variant: 'secondary' as const, className: 'bg-amber-500 hover:bg-amber-600 text-white border-0' }
                          }
                        }
                        const badge = getBadge(activity.type)
                        return (
                          <article
                            key={activity.timestamp}
                            className="group p-5 border-2 rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <h4 className="font-heading font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">
                                  {activity.title}
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {activity.description}
                                </p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatRelativeTime(activity.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge 
                                  variant={badge.variant} 
                                  className={cn("text-xs font-medium", badge.className)}
                                >
                                  {badge.label}
                                </Badge>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    ) : (
                      <div className="text-center py-16 px-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                          <Briefcase className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No recent activities</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                          Start applying for jobs to see your activity here. Your application history will appear in this section.
                        </p>
                        <Link href="/opportunities">
                          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Browse Jobs
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Profile & Skills */}
              <aside className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-lg sm:text-xl">Profile Completion</CardTitle>
                      <CardDescription className="text-sm">
                        Complete your profile to get more job matches
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Trust Score</span>
                        <span className="font-bold text-primary">{workerData?.stats.trustScore || 0}/100</span>
                      </div>
                      <Progress value={workerData?.stats.trustScore || 0} className="h-3" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {workerData?.stats.verified ? (
                        <Badge variant="default" className="text-xs font-medium bg-green-500 hover:bg-green-600 text-white border-0">
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-medium">
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-2 hover:bg-muted"
                      size="lg"
                      onClick={() => handleQuickAction("complete-profile", activeRole)}
                    >
                      Complete Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-lg sm:text-xl">Job Statistics</CardTitle>
                      <CardDescription className="text-sm">
                        Your job application performance
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-primary/5 border-2 border-primary/10">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {workerData?.stats.activeJobs || 0}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Active Jobs</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-500/5 border-2 border-amber-500/10">
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {workerData?.stats.pendingApplications || 0}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-2 hover:bg-muted" size="lg">
                      <Award className="mr-2 h-4 w-4" />
                      View All Applications
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>

          {/* Recruiter Dashboard */}
          <TabsContent value="recruiter" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid */}
            <section className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Jobs</CardTitle>
                  <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                    <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-300">{stats?.recruiter?.activeJobs || 0}</div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Currently posted</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Total Applicants</CardTitle>
                  <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-300">{stats?.recruiter?.totalApplications || 0}</div>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">All applications</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Hired Workers</CardTitle>
                  <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-300">{(stats?.recruiter as any)?.hiredWorkers || 0}</div>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Accepted applications</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Response Rate</CardTitle>
                  <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-300">{stats?.reviewsReceived || 0}</div>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Reviews received</p>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              {/* Active Job Postings */}
              <section className="lg:col-span-2">
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="font-heading text-xl sm:text-2xl">Active Job Postings</CardTitle>
                        <CardDescription className="text-sm">
                          Monitor your current job listings and applications
                        </CardDescription>
                      </div>
                      <Link href="/opportunities/post">
                        <Button 
                          size="lg" 
                          className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Post Job
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recruiterLoading ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground mt-4">Loading jobs...</p>
                      </div>
                    ) : recruiterJobs.length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                          <Briefcase className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Start recruiting by posting your first job opportunity. Connect with skilled workers across Central Luzon!
                        </p>
                        <Link href="/opportunities/post">
                          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                            <Plus className="mr-2 h-4 w-4" />
                            Post Your First Job
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      recruiterJobs.map((job) => {
                        const daysAgo = formatRelativeTime(job.created_at)
                        const urgencyColor = job.urgency === "high" ? "destructive" : job.urgency === "medium" ? "default" : "secondary"
                        return (
                          <article
                            key={job._id}
                            className="group p-5 border-2 rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-heading font-semibold text-base sm:text-lg mb-2 group-hover:text-primary transition-colors">
                                      {job.title}
                                    </h4>
                                    <div className="flex items-center gap-2 flex-wrap mb-3">
                                      <Badge variant={urgencyColor} className="text-xs font-medium">
                                        {job.urgency || "low"} priority
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="line-clamp-1">{job.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>Posted {daysAgo}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4 flex-shrink-0" />
                                    <span className="font-medium">{job.applicantCount || 0}</span>
                                    <span>applicant{job.applicantCount !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:flex-col sm:gap-2 flex-shrink-0">
                                <Link href={`/opportunities/${job._id}`} className="flex-1 sm:w-full">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-2 hover:bg-muted"
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    View
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  className="flex-1 sm:w-full bg-primary hover:bg-primary/90"
                                  onClick={() => handleManageJob(job)}
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Recent Applicants */}
              <aside>
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-lg sm:text-xl">Recent Applicants</CardTitle>
                      <CardDescription className="text-sm">
                        Review new applications
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recruiterLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground mt-3 text-sm">Loading...</p>
                      </div>
                    ) : recentApplicants.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No recent applicants</p>
                        <p className="text-xs text-muted-foreground mt-1">New applications will appear here</p>
                      </div>
                    ) : (
                      recentApplicants.map((applicant) => {
                        const rating = (applicant.worker.trust_score / 20).toFixed(1)
                        const statusColor = applicant.status === "accepted" ? "default" : 
                                          applicant.status === "rejected" ? "destructive" : 
                                          "secondary"
                        return (
                          <article 
                            key={applicant._id} 
                            className="group p-4 border-2 rounded-lg space-y-3 hover:shadow-md hover:border-primary/50 transition-all duration-300 bg-card"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm sm:text-base mb-1 group-hover:text-primary transition-colors truncate">
                                  {applicant.worker.full_name}
                                </h5>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {applicant.opportunity.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-sm flex-shrink-0">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Badge 
                                variant={statusColor}
                                className={cn(
                                  "text-xs font-medium",
                                  applicant.status === "accepted" && "bg-green-500 hover:bg-green-600 text-white border-0"
                                )}
                              >
                                {applicant.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(applicant.created_at)}
                              </span>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>

          {/* Buyer Dashboard */}
          <TabsContent value="buyer" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid */}
            <section className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Orders</CardTitle>
                  <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                    <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-300">{stats?.buyer?.pendingOrders || 0}</div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Currently processing</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Total Purchases</CardTitle>
                  <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-300">{stats?.buyer?.totalOrders || 0}</div>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">All time orders</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">My Products</CardTitle>
                  <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                    <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-300">{stats?.seller?.activeProducts || 0}</div>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Active listings</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Earnings</CardTitle>
                  <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-300">₱{(stats?.seller?.totalEarnings || 0).toLocaleString()}</div>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">From sales</p>
                </CardContent>
              </Card>
            </section>

            {/* My Products Section */}
            <section>
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-xl sm:text-2xl">My Products</CardTitle>
                      <CardDescription className="text-sm">
                        Manage your product listings
                      </CardDescription>
                    </div>
                    <Link href="/marketplace/sell">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        List Product
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {buyerLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground mt-4">Loading products...</p>
                    </div>
                  ) : buyerProducts.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <Package className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Start selling by listing your first product. Reach buyers across Central Luzon!
                      </p>
                      <Link href="/marketplace/sell">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                          <Plus className="mr-2 h-4 w-4" />
                          List Your First Product
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {buyerProducts.map((product) => {
                        const daysAgo = formatRelativeTime(product.created_at)
                        const imageUrl = product.images?.[0] || "/placeholder.svg"
                        const isActive = product.status === "active"
                        return (
                          <article
                            key={product._id}
                            className="group flex flex-col border-2 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card"
                          >
                            {/* Product Image */}
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              <img
                                src={imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3">
                                <Badge 
                                  variant={isActive ? "default" : product.status === "pending_approval" ? "secondary" : "outline"}
                                  className={cn(
                                    "font-medium text-xs",
                                    isActive && "bg-green-500 hover:bg-green-600 text-white border-0"
                                  )}
                                >
                                  {isActive ? "Active" : product.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
                              <div className="space-y-2">
                                <h4 className="font-heading font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                  {product.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg sm:text-xl font-bold text-primary">
                                    ₱{product.price?.toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {product.quantity_available} {product.unit || "piece"}
                                  </span>
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2 border-t">
                                <div className="flex items-center gap-1.5">
                                  <Eye className="h-3.5 w-3.5" />
                                  <span className="font-medium">{product.views || 0} views</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{daysAgo}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
                              <Link href={`/marketplace/${product._id}`} className="flex-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-2 hover:bg-muted"
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90"
                                onClick={() => handleManageProduct(product)}
                              >
                                Manage
                              </Button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
              {/* Left Column - Orders and Sales */}
              <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6">
                {/* Recent Orders */}
                <section>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Orders</CardTitle>
                    <CardDescription>Track your current and recent purchases</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {buyerOrdersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
                    ) : buyerOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No recent orders found.</p>
                        <Link href="/marketplace">
                          <Button className="shadow-md hover:shadow-lg transition-all duration-200">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Browse Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      buyerOrders.map((order) => {
                        const daysAgo = formatRelativeTime(order.created_at)
                        const imageUrl = order.product_id?.images?.[0] || "/placeholder.svg"
                        return (
                          <article
                            key={order._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4 hover:bg-muted/50 transition-colors duration-200"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-3">
                                <img
                                  src={imageUrl}
                                  alt={order.product_id?.title || "Product"}
                                  className="w-12 h-12 object-cover rounded-md"
                                />
                                <div className="space-y-1">
                                  <h4 className="font-medium">{order.product_id?.title || "Unknown Product"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {order.quantity} {order.product_id?.unit || "units"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Seller: {order.seller_id?.full_name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              <div className="text-right">
                                <div className="font-medium">₱{order.total_price.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">{daysAgo}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Badge variant={
                                    order.status === "delivered" ? "default" :
                                    order.status === "shipped" ? "secondary" :
                                    order.status === "confirmed" ? "outline" :
                                    order.status === "cancelled" ? "destructive" :
                                    "secondary"
                                  }>
                                    {order.status}
                                  </Badge>
                                  <Badge variant={
                                    order.payment_status === "paid" ? "default" :
                                    order.payment_status === "failed" ? "destructive" :
                                    "secondary"
                                  }>
                                    {order.payment_status}
                                  </Badge>
                                </div>
                                {/* Track Order button for buyers */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  onClick={() => setTrackingOrderId(order._id)}
                                >
                                  <Truck className="mr-2 h-4 w-4" />
                                  Track Order
                                </Button>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
                </section>

                {/* Recent Sales */}
                <section>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Recent Sales</CardTitle>
                    <CardDescription>Track your recent product sales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {sellerOrdersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading sales...</div>
                    ) : sellerOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No recent sales found.</p>
                        <Link href="/marketplace">
                          <Button className="shadow-md hover:shadow-lg transition-all duration-200">
                            <Plus className="mr-2 h-4 w-4" />
                            List Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      sellerOrders.map((order) => {
                        const daysAgo = formatRelativeTime(order.created_at)
                        const imageUrl = order.product_id?.images?.[0] || "/placeholder.svg"
                        return (
                          <article
                            key={order._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4 hover:bg-muted/50 transition-colors duration-200"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-3">
                                <img
                                  src={imageUrl}
                                  alt={order.product_id?.title || "Product"}
                                  className="w-12 h-12 object-cover rounded-md"
                                />
                                <div className="space-y-1">
                                  <h4 className="font-medium">{order.product_id?.title || "Unknown Product"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {order.quantity} {order.product_id?.unit || "units"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Buyer: {order.buyer_id?.full_name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              <div className="text-right">
                                <div className="font-medium">₱{order.total_price.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">{daysAgo}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Badge variant={
                                    order.status === "delivered" ? "default" :
                                    order.status === "shipped" ? "secondary" :
                                    order.status === "confirmed" ? "outline" :
                                    order.status === "cancelled" ? "destructive" :
                                    "secondary"
                                  }>
                                    {order.status}
                                  </Badge>
                                  <Badge variant={
                                    order.payment_status === "paid" ? "default" :
                                    order.payment_status === "failed" ? "destructive" :
                                    "secondary"
                                  }>
                                    {order.payment_status}
                                  </Badge>
                                </div>
                                {/* Action buttons for sellers */}
                                <div className="flex flex-col gap-2">
                                  {/* Confirm Order button - only show for pending orders with paid status */}
                                  {order.status === "pending" && order.payment_status === "paid" && (
                                    <Button
                                      size="sm"
                                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                                      onClick={async () => {
                                        try {
                                          const res = await authFetch(`/api/marketplace/orders/${order._id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "confirmed" }),
                                          });
                                          if (res.ok) {
                                            notifications.showSuccess("Order Confirmed", "Order has been confirmed");
                                            // Refresh orders
                                            window.location.reload();
                                          } else {
                                            const errorData = await res.json().catch(() => ({}));
                                            notifications.showError("Error", errorData.message || "Failed to confirm order");
                                          }
                                        } catch (error: any) {
                                          notifications.showError("Error", error.message || "Failed to confirm order");
                                        }
                                      }}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Confirm Order
                                    </Button>
                                  )}
                                  {/* Manage Delivery button - show for confirmed/paid orders */}
                                  {order.status !== "pending" && order.payment_status === "paid" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full sm:w-auto"
                                      onClick={() => setDeliveryOrderId(order._id)}
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Manage Delivery
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
                </section>
              </div>

              {/* Featured Products */}
              <section className="w-full lg:w-80">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="font-heading">Featured Products</CardTitle>
                    <CardDescription>Fresh picks from local suppliers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {featuredProductsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                    ) : featuredProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No featured products found.</p>
                        <Link href="/marketplace">
                          <Button className="shadow-md hover:shadow-lg transition-all duration-200">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Browse All Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      featuredProducts.map((product) => {
                        console.log("Featured product data:", product)
                        const imageUrl = product.images?.[0] || "/placeholder.svg"
                        const daysAgo = formatRelativeTime(product.created_at)
                        return (
                          <article key={product._id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 hover:shadow-md transition-all duration-200">
                            <div className="flex gap-3">
                              <img
                                src={imageUrl}
                                alt={product.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 space-y-2">
                                <h5 className="font-medium text-base">{product.title}</h5>
                                <p className="text-sm text-muted-foreground">{product.seller_id?.full_name || "Unknown Seller"}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{product.rating || 4.5}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">{product.seller_id?.location || "Unknown"}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{daysAgo}</p>
                                <p className="text-xs text-muted-foreground">Category: {product.category || "General"}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-primary">₱{product.price.toLocaleString()}/{product.unit}</span>
                              <Button
                                size="sm"
                                onClick={() => {
                                  notifications.showInfo("Add to Cart", `Adding ${product.title} to cart...`)
                                  router.push(`/marketplace/product/${product._id}`)
                                }}
                              >
                                View Product
                              </Button>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </header>

      {/* Manage Job Modal */}
      {selectedJob && (
        <ManageJobModal
          job={selectedJob}
          open={manageModalOpen}
          onClose={() => {
            setManageModalOpen(false)
            setSelectedJob(null)
          }}
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
        />
      )}

      {selectedProduct && (
        <ManageProductModal
          product={selectedProduct}
          open={manageProductModalOpen}
          onClose={() => {
            setManageProductModalOpen(false)
            setSelectedProduct(null)
          }}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* Order Tracking Modal for Buyers */}
      <OrderTrackingModal
        open={!!trackingOrderId}
        onOpenChange={(open) => !open && setTrackingOrderId(null)}
        orderId={trackingOrderId || ""}
      />

      {/* Delivery Management Modal for Sellers */}
      <DeliveryManagementModal
        open={!!deliveryOrderId}
        onOpenChange={(open) => {
          if (!open) {
            setDeliveryOrderId(null)
          }
        }}
        orderId={deliveryOrderId || ""}
      />
    </div>
  )
}
