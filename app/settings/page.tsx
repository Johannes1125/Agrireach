import { redirect } from "next/navigation"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsContent } from "@/components/settings/settings-content"
import { getCurrentUser } from "@/lib/auth-server"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <SettingsHeader user={{
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: (user as any).roles || [user.role],
        avatar: user.avatar_url,
        location: user.location || "Not specified",
        joinDate: new Date(user.created_at).toISOString().split('T')[0],
        bio: "Experienced member of the AgriReach community.",
        verified: user.verified,
        rating: user.trust_score / 20,
        completedJobs: 0,
        phone: user.phone || "",
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            jobAlerts: true,
            messageAlerts: true,
            marketingEmails: false,
          },
          privacy: {
            profileVisibility: "public" as const,
            showLocation: true,
            showContactInfo: false,
            showRating: true,
          },
          account: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
            dataRetention: 365,
          },
        },
      }} />
      <main className="container px-4 py-8">
        <SettingsContent user={{
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: (user as any).roles || [user.role],
          avatar: user.avatar_url,
          location: user.location || "Not specified",
          joinDate: new Date(user.created_at).toISOString().split('T')[0],
          bio: "Experienced member of the AgriReach community.",
          verified: user.verified,
          rating: user.trust_score / 20,
          completedJobs: 0,
          phone: user.phone || "",
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false,
              jobAlerts: true,
              messageAlerts: true,
              marketingEmails: false,
            },
            privacy: {
              profileVisibility: "public" as const,
              showLocation: true,
              showContactInfo: false,
              showRating: true,
            },
            account: {
              twoFactorEnabled: false,
              sessionTimeout: 30,
              dataRetention: 365,
            },
          },
        }} />
      </main>
    </div>
  )
}
