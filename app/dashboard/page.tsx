import { redirect } from "next/navigation"
import { SimpleHeader } from "@/components/layout/simple-header"
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard"

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
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <SimpleHeader />

      <main className="container px-4 py-8 w-full">
        <UnifiedDashboard user={user} />
      </main>
    </div>
  )
}
