"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import Link from "next/link"
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
  Settings,
} from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useBuyerStats } from "@/hooks/use-buyer-stats"
import { SkillCard } from "@/components/ui/skill-card"
import { normalizeSkills, groupSkillsByCategory, SkillCategory, SKILL_LEVELS, SKILL_LEVEL_COLORS, CATEGORY_COLORS } from "@/lib/skills"

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
  const { profile } = useUserProfile()
  const { stats: buyerStats, recentOrders, loading: buyerStatsLoading } = useBuyerStats()
  const hasBusiness = !!(profile && (
    profile.company_name || profile.business_type || profile.industry || profile.company_size ||
    profile.website || profile.business_description || (Array.isArray(profile.services_offered) && profile.services_offered.length > 0) ||
    typeof profile.years_in_business === 'number'
  ))
  const getProfileData = () => {
    switch (user.role) {
      case "worker":
        return {
          stats: {
            primary: { label: "Completed Jobs", value: user.completedJobs || 47, icon: Briefcase },
            secondary: { label: "Total Earnings", value: "₱1,250,000", icon: DollarSign },
            tertiary: { label: "Hours Worked", value: "1,240", icon: Clock },
            quaternary: { label: "Rating", value: user.rating || 4.8, icon: Star },
          },
          skills: profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0
            ? (typeof profile.skills[0] === 'string'
              ? (profile.skills as string[]).map((skillName) => ({ 
                  name: skillName, 
                  level: 2, 
                  category: "Farm Management"
                }))
              : (profile.skills as Array<{ name: string; level: number; category: string }>))
            : [],
          recentActivity: [
            {
              title: "Seasonal Fruit Harvesting",
              company: "Green Valley Farms",
              location: "Davao City, Philippines",
              status: "completed",
              date: "2024-02-20",
              rating: 4.9,
            },
            {
              title: "Organic Vegetable Planting",
              company: "Sustainable Acres",
              location: "Baguio City, Philippines",
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
              location: "Davao City, Philippines",
              status: "active",
              date: "2024-02-15",
              applicants: 24,
            },
            {
              title: "Organic Farm Supervisor",
              company: "Posted Job",
              location: "Baguio City, Philippines",
              status: "active",
              date: "2024-02-10",
              applicants: 12,
            },
          ],
        }

      case "buyer":
        return {
          stats: {
            primary: { label: "Total Orders", value: buyerStats?.totalOrders || 0, icon: Package },
            secondary: { label: "Total Spent", value: buyerStats ? `₱${(buyerStats.totalSpent / 100).toLocaleString()}` : "₱0", icon: DollarSign },
            tertiary: { label: "Active Orders", value: buyerStats?.activeOrders || 0, icon: Clock },
            quaternary: { label: "Rating", value: buyerStats?.averageRating || 0, icon: Star },
          },
          businessInfo: {
            name: "Fresh Market Distribution Co.",
            type: "Wholesale Food Distribution",
            size: "25-50 employees",
            website: "www.freshmarketdist.com",
          },
          recentActivity: recentOrders.map(order => ({
            title: order.productName,
            company: order.supplier,
            location: order.quantity,
            status: order.status,
            date: order.date,
            amount: `₱${(order.amount / 100).toLocaleString()}`,
          })),
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
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* About Section */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl sm:text-2xl">About</CardTitle>
            <CardDescription className="text-sm">Profile information and background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{user.bio}</p>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">{user.location}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm truncate">{user.email}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Badge 
                  variant={user.verified ? "default" : "outline"}
                  className={user.verified ? "bg-green-500 hover:bg-green-600 text-white border-0" : ""}
                >
                  {user.verified ? "✓ Verified" : "Unverified"}
                </Badge>
              </div>
            </div>

            {/* Company/Business Info for Recruiters and Buyers */}
            {user.role === "recruiter" && profileData.companyInfo && (
              <div className="pt-5 border-t">
                <h4 className="font-semibold mb-4 text-base">Company Information</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Building className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{profile?.company_name || profileData.companyInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{profile?.company_size || profileData.companyInfo.size}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border md:col-span-2">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{profile?.website || profileData.companyInfo.website}</span>
                  </div>
                </div>
              </div>
            )}

            {user.role === "buyer" && hasBusiness && (
              <div className="pt-5 border-t">
                <h4 className="font-semibold mb-4 text-base">Business Information</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Building className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{profile?.company_name}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{profile?.business_type}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border md:col-span-2">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{profile?.website}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Worker Skills Pills shown directly under About */}
            {user.role === "worker" && profileData.skills && profileData.skills.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">My Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {normalizeSkills((profileData.skills ?? []) as any).map((skill, index) => {
                    const levelLabel = SKILL_LEVELS[skill.level as keyof typeof SKILL_LEVELS]
                    const levelColor = SKILL_LEVEL_COLORS[skill.level as keyof typeof SKILL_LEVEL_COLORS]
                    const categoryColor = CATEGORY_COLORS[skill.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS["Crop Farming"]
                    return (
                      <div
                        key={`${skill.name}-${index}`}
                        className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1"
                      >
                        <span className="text-xs font-medium text-foreground">{skill.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${categoryColor}`}>{skill.category}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${levelColor}`}>{levelLabel}</Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Section (Workers only) */}
        {user.role === "worker" && profileData.skills && profileData.skills.length > 0 && (() => {
          const normalizedSkills = normalizeSkills((profileData.skills ?? []) as any);
          const groupedSkills = groupSkillsByCategory(normalizedSkills);
          const categories = Object.keys(groupedSkills) as SkillCategory[];
          
          return (
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-xl sm:text-2xl">Skills & Expertise</CardTitle>
                <CardDescription className="text-sm">
                  Your skills organized by category. Jobs matching your skills will be prioritized.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category) => {
                  const skills = groupedSkills[category];
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          {category}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {skills.map((skill, index) => (
                          <SkillCard
                            key={`${skill.name}-${index}`}
                            skill={skill}
                            showCategory={false}
                            showLevel={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })()}

        {/* Recent Activity */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl sm:text-2xl">
              Recent {user.role === "worker" ? "Work" : user.role === "recruiter" ? "Job Postings" : "Orders"}
            </CardTitle>
            <CardDescription className="text-sm">
              {user.role === "worker"
                ? "Latest job applications and completed work"
                : user.role === "recruiter"
                  ? "Recent job postings and hiring activity"
                  : "Recent purchase history and orders"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.recentActivity.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              </div>
            ) : (
              profileData.recentActivity.map((activity, index) => (
              <div key={index} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 border-2 rounded-lg hover:shadow-md hover:border-primary/50 transition-all">
                <div className="flex-1 space-y-2">
                  <h4 className="font-heading font-semibold text-base group-hover:text-primary transition-colors">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>

                  <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {activity.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {activity.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={activity.status === "active" ? "default" : "secondary"}
                      className={activity.status === "active" ? "bg-green-500 hover:bg-green-600 text-white border-0" : ""}
                    >
                      {activity.status}
                    </Badge>
                    {"rating" in activity && activity.rating ? (
                      <div className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{activity.rating}</span>
                      </div>
                    ) : null}
                    {"applicants" in activity && activity.applicants ? (
                      <span className="text-sm text-muted-foreground">{activity.applicants} applicants</span>
                    ) : null}
                    {"amount" in activity && activity.amount ? (
                      <span className="text-sm font-bold text-primary">{activity.amount}</span>
                    ) : null}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full sm:w-auto border-2 hover:bg-muted/70 dark:hover:bg-card/50">
                  View Details
                </Button>
              </div>
            ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Statistics */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg sm:text-xl">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profileData.stats).map(([key, stat]) => {
              const IconComponent = stat.icon
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="font-bold text-base">{stat.value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.role === "worker" && (
              <>
                <Link href="/opportunities">
                  <Button className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" size="sm">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Find Jobs
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50" size="sm">
                  <Award className="mr-2 h-4 w-4" />
                  View Certificates
                </Button>
              </>
            )}

            {user.role === "recruiter" && (
              <>
                <Link href="/opportunities/create">
                  <Button className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Post New Job
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50" size="sm">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </>
            )}

            {user.role === "buyer" && (
              <>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50 mb-3" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50" size="sm">
                  <Star className="mr-2 h-4 w-4" />
                  Favorite Suppliers
                </Button>
              </>
            )}

            <Link href="/settings">
              <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50" size="sm">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg sm:text-xl">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm truncate">{user.email}</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm">{user.location}</span>
            </div>

            {user.verified && (
              <div className="pt-3 border-t">
                <Badge className="w-full justify-center bg-green-500 hover:bg-green-600 text-white border-0 py-2">
                  ✓ Verified Profile
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Profile Section */}
        {hasBusiness && (
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg sm:text-xl">Business Profile</CardTitle>
            <CardDescription className="text-sm">Showcase your business and services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</Label>
                <p className="text-sm font-medium mt-1">{profile?.company_name || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Industry</Label>
                <p className="text-sm font-medium mt-1">{profile?.industry || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Business Type</Label>
                <p className="text-sm font-medium mt-1">{profile?.business_type || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Years in Business</Label>
                <p className="text-sm font-medium mt-1">{typeof profile?.years_in_business === 'number' ? profile?.years_in_business : 'N/A'}</p>
              </div>
              {profile?.business_address && (
                <div className="md:col-span-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Business Address</Label>
                  <p className="text-sm font-medium mt-1">{profile.business_address}</p>
                </div>
              )}
              {profile?.business_hours && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Business Hours</Label>
                  <p className="text-sm font-medium mt-1">{profile.business_hours}</p>
                </div>
              )}
              {profile?.business_registration && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Registration Number</Label>
                  <p className="text-sm font-medium mt-1">{profile.business_registration}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Business Description</Label>
              {profile?.business_description ? (
                <p className="text-sm text-foreground mt-2 leading-relaxed">
                  {profile.business_description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2 italic">No description provided</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Services Offered</Label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(profile?.services_offered) && profile!.services_offered.length > 0 ? (
                  profile!.services_offered.map((svc, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{svc}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No services listed</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href="/settings?tab=business">
                <Button variant="outline" className="w-full border-2 hover:bg-muted/70 dark:hover:bg-card/50">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Business Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
