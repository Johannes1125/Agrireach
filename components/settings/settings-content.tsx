"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications } from "@/components/notifications/notification-provider"
import {
  Bell,
  Shield,
  CreditCard,
  Briefcase,
  Users,
  ShoppingCart,
  Camera,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface SettingsUser {
  id: string
  name: string
  email: string
  role: "worker" | "recruiter" | "buyer"
  avatar: string
  location: string
  bio?: string
  phone?: string
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
      jobAlerts: boolean
      messageAlerts: boolean
      marketingEmails: boolean
    }
    privacy: {
      profileVisibility: "public" | "private" | "contacts"
      showLocation: boolean
      showContactInfo: boolean
      showRating: boolean
    }
    account: {
      twoFactorEnabled: boolean
      sessionTimeout: number
      dataRetention: number
    }
  }
}

interface SettingsContentProps {
  user: SettingsUser
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [formData, setFormData] = useState(user)
  const [activeRole, setActiveRole] = useState(user.role)
  const notifications = useNotifications()

  const handleSave = (section: string) => {
    notifications.showSuccess("Settings Saved", `Your ${section} settings have been updated successfully.`)
  }

  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole as "worker" | "recruiter" | "buyer")
    setFormData({ ...formData, role: newRole as "worker" | "recruiter" | "buyer" })
    notifications.showInfo("Role Updated", `Your active role has been changed to ${newRole}.`)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "worker":
        return <Briefcase className="h-4 w-4" />
      case "recruiter":
        return <Users className="h-4 w-4" />
      case "buyer":
        return <ShoppingCart className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "worker":
        return "Find and apply for agricultural jobs, showcase your skills and experience"
      case "recruiter":
        return "Post job opportunities, manage applications, and hire qualified workers"
      case "buyer":
        return "Browse and purchase fresh products directly from local farmers and suppliers"
      default:
        return "Select your primary role on the platform"
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Privacy
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Account
        </TabsTrigger>
      </TabsList>

      {/* Profile Settings */}
      <TabsContent value="profile" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Basic Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others about yourself, your experience, and what you're looking for..."
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={() => handleSave("profile")} className="w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Platform Role</CardTitle>
                <CardDescription>Choose your primary role to customize your dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {["worker", "recruiter", "buyer"].map((role) => (
                    <div
                      key={role}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        activeRole === role
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleRoleChange(role)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getRoleIcon(role)}
                        <h4 className="font-medium capitalize">{role}</h4>
                        {activeRole === role && <Badge variant="secondary">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{getRoleDescription(role)}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> You can switch between roles anytime. Your profile data and history will be
                    preserved for each role.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Picture */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Profile Picture</CardTitle>
                <CardDescription>Upload a professional photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={formData.avatar || "/placeholder.svg"} alt={formData.name} />
                    <AvatarFallback className="text-2xl">
                      {formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to be notified about important updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Communication Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={formData.preferences.notifications.email}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, email: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={formData.preferences.notifications.push}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, push: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive text message alerts</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={formData.preferences.notifications.sms}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, sms: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Content Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="job-alerts">Job Alerts</Label>
                    <p className="text-sm text-muted-foreground">New job opportunities matching your profile</p>
                  </div>
                  <Switch
                    id="job-alerts"
                    checked={formData.preferences.notifications.jobAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, jobAlerts: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-alerts">Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">New messages and communications</p>
                  </div>
                  <Switch
                    id="message-alerts"
                    checked={formData.preferences.notifications.messageAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, messageAlerts: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={formData.preferences.notifications.marketingEmails}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          notifications: { ...formData.preferences.notifications, marketingEmails: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={() => handleSave("notification")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy Settings */}
      <TabsContent value="privacy" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Privacy Settings</CardTitle>
            <CardDescription>Control who can see your information and how it's used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={formData.preferences.privacy.profileVisibility}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        privacy: {
                          ...formData.preferences.privacy,
                          profileVisibility: value as "public" | "private" | "contacts",
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                    <SelectItem value="contacts">Contacts Only - Only people you've worked with</SelectItem>
                    <SelectItem value="private">Private - Only you can view your profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-location">Show Location</Label>
                    <p className="text-sm text-muted-foreground">Display your location on your profile</p>
                  </div>
                  <Switch
                    id="show-location"
                    checked={formData.preferences.privacy.showLocation}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: { ...formData.preferences.privacy, showLocation: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-contact">Show Contact Information</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see your contact details</p>
                  </div>
                  <Switch
                    id="show-contact"
                    checked={formData.preferences.privacy.showContactInfo}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: { ...formData.preferences.privacy, showContactInfo: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-rating">Show Rating</Label>
                    <p className="text-sm text-muted-foreground">Display your rating and reviews publicly</p>
                  </div>
                  <Switch
                    id="show-rating"
                    checked={formData.preferences.privacy.showRating}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          privacy: { ...formData.preferences.privacy, showRating: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={() => handleSave("privacy")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Settings */}
      <TabsContent value="billing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Billing & Subscription</CardTitle>
            <CardDescription>Manage your payment methods and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Current Plan: Free</h4>
              <p className="text-sm text-muted-foreground mb-4">
                You're currently on the free plan with basic features. Upgrade to unlock premium features.
              </p>
              <Button>Upgrade to Premium</Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Payment Methods</h4>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">No payment methods added yet.</p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Add Payment Method
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Billing History</h4>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">No billing history available.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Settings */}
      <TabsContent value="account" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Account Security</CardTitle>
            <CardDescription>Manage your account security and data preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={formData.preferences.account.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        account: { ...formData.preferences.account, twoFactorEnabled: checked },
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Select
                  value={formData.preferences.account.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        account: { ...formData.preferences.account, sessionTimeout: Number.parseInt(value) },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => handleSave("account")} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="font-heading text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions that affect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
