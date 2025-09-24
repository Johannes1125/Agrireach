import { redirect } from "next/navigation"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsContent } from "@/components/settings/settings-content"

// TODO: Replace with actual auth check
const getCurrentUser = async () => {
  // Mock user data - replace with actual authentication
  return {
    id: "1",
    name: "John Farmer",
    email: "john@example.com",
    role: "worker" as const,
    avatar: "/farmer-avatar.png",
    location: "Rural Valley, CA",
    joinDate: "2024-01-15",
    bio: "Experienced organic farmer with 15 years in sustainable agriculture. Specializing in crop rotation and soil health management.",
    verified: true,
    rating: 4.8,
    completedJobs: 47,
    phone: "(559) 555-0123",
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
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <SettingsHeader user={user} />
      <main className="container px-4 py-8">
        <SettingsContent user={user} />
      </main>
    </div>
  )
}
