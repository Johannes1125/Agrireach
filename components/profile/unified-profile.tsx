import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Calendar,
  Star,
  Building,
  Package,
  Users,
  Globe,
  Mail,
  Briefcase,
  Award,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  location: string
  rating?: number
  completedJobs?: number
  email: string
  joinDate: string
  bio: string
  verified: boolean
}

interface UnifiedProfileProps {
  user: User
}

export function UnifiedProfile({ user }: UnifiedProfileProps) {
  // Mock data that adapts based on role
  const getProfileData = () => {
    switch (user.role) {
      case "worker":
        return {
          stats: {
            primary: { label: "Completed Jobs", value: user.completedJobs || 47, icon: Briefcase },
            secondary: { label: "Total Earnings", value: "$45,600", icon: DollarSign },
            tertiary: { label: "Hours Worked", value: "1,240", icon: Clock },
            quaternary: { label: "Rating", value: user.rating || 4.8, icon: Star },
          },
          skills: [
            { name: "Crop Harvesting", level: 95, verified: true },
            { name: "Organic Farming", level: 88, verified: true },
            { name: "Equipment Operation", level: 75, verified: false },
            { name: "Soil Management", level: 82, verified: true },
          ],
          recentActivity: [
            {
              title: "Seasonal Fruit Harvesting",
              company: "Green Valley Farms",
              location: "Fresno, CA",
              status: "completed",
              date: "2024-02-20",
              rating: 4.9,
            },
            {
              title: "Organic Vegetable Planting",
              company: "Sustainable Acres",
              location: "Salinas, CA",
              status: "active",
              date: "2024-02-15",
              rating: null,
            },
          ],
        }

      case "recruiter":
        return {
          stats: {
            primary: { label: "Active Jobs", value: 8, icon: Briefcase },
            secondary: { label: "Total Hires", value: "156", icon: Users },
            tertiary: { label: "Response Rate", value: "87%", icon: TrendingUp },
            quaternary: { label: "Rating", value: 4.7, icon: Star },
          },
          companyInfo: {
            name: "Green Valley Agricultural Services",
            industry: "Sustainable Agriculture",
            size: "50-200 employees",
            website: "www.greenvalleyag.com",
          },
          recentActivity: [
            {
              title: "Seasonal Harvest Coordinator",
              company: "Posted Job",
              location: "Fresno, CA",
              status: "active",
              date: "2024-02-15",
              applicants: 24,
            },
            {
              title: "Organic Farm Supervisor",
              company: "Posted Job",
              location: "Salinas, CA",
              status: "active",
              date: "2024-02-10",
              applicants: 12,
            },
          ],
        }

      case "buyer":
        return {
          stats: {
            primary: { label: "Total Orders", value: 234, icon: Package },
            secondary: { label: "Total Spent", value: "$125,600", icon: DollarSign },
            tertiary: { label: "Active Orders", value: "12", icon: Clock },
            quaternary: { label: "Rating", value: 4.9, icon: Star },
          },
          businessInfo: {
            name: "Fresh Market Distribution Co.",
            type: "Wholesale Food Distribution",
            size: "25-50 employees",
            website: "www.freshmarketdist.com",
          },
          recentActivity: [
            {
              title: "Organic Tomatoes",
              company: "Green Valley Farms",
              location: "500 lbs",
              status: "delivered",
              date: "2024-02-20",
              amount: "$1,250",
            },
            {
              title: "Fresh Strawberries",
              company: "Berry Best Farm",
              location: "200 lbs",
              status: "delivered",
              date: "2024-02-18",
              amount: "$800",
            },
          ],
        }

      default:
        return {
          stats: {
            primary: { label: "Activity", value: 0, icon: Briefcase },
            secondary: { label: "Rating", value: "N/A", icon: Star },
            tertiary: { label: "Joined", value: "2024", icon: Calendar },
            quaternary: { label: "Location", value: user.location, icon: MapPin },
          },
          recentActivity: [],
        }
    }
  }

  const profileData = getProfileData()

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">About</CardTitle>
            <CardDescription>Profile information and background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{user.bio}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={user.verified ? "secondary" : "outline"}>
                  {user.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>

            {/* Company/Business Info for Recruiters and Buyers */}
            {user.role === "recruiter" && profileData.companyInfo && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Company Information</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.companyInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.companyInfo.size}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.companyInfo.website}</span>
                  </div>
                </div>
              </div>
            )}

            {user.role === "buyer" && profileData.businessInfo && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Business Information</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.businessInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.businessInfo.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.businessInfo.website}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Section (Workers only) */}
        {user.role === "worker" && profileData.skills && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Skills & Expertise</CardTitle>
              <CardDescription>Verified skills based on completed work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData.skills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {skill.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              Recent {user.role === "worker" ? "Work" : user.role === "recruiter" ? "Job Postings" : "Orders"}
            </CardTitle>
            <CardDescription>
              {user.role === "worker"
                ? "Latest job applications and completed work"
                : user.role === "recruiter"
                  ? "Recent job postings and hiring activity"
                  : "Recent purchase history and orders"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {activity.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={activity.status === "active" ? "default" : "secondary"}>{activity.status}</Badge>
                    {activity.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{activity.rating}</span>
                      </div>
                    )}
                    {activity.applicants && (
                      <span className="text-sm text-muted-foreground">{activity.applicants} applicants</span>
                    )}
                    {activity.amount && <span className="text-sm font-medium text-primary">{activity.amount}</span>}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(profileData.stats).map(([key, stat]) => {
              const IconComponent = stat.icon
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="font-medium">{stat.value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.role === "worker" && (
              <>
                <Button className="w-full" size="sm">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <Award className="mr-2 h-4 w-4" />
                  View Certificates
                </Button>
              </>
            )}

            {user.role === "recruiter" && (
              <>
                <Button className="w-full" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Post New Job
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </>
            )}

            {user.role === "buyer" && (
              <>
                <Button className="w-full" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  Browse Products
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <Star className="mr-2 h-4 w-4" />
                  Favorite Suppliers
                </Button>
              </>
            )}

            <Button variant="outline" className="w-full bg-transparent" size="sm">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.location}</span>
            </div>

            {user.verified && (
              <div className="pt-2 border-t">
                <Badge variant="secondary" className="w-full justify-center">
                  ✓ Verified Profile
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
