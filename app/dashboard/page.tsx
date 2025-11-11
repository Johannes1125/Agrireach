import { redirect } from "next/navigation"
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard"
import { getCurrentUser } from "@/lib/auth-server"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8">
        <UnifiedDashboard user={{
          id: user.id,
          name: user.full_name,
          role: (user as any).roles?.[0] || user.role,
          location: user.location || "Not specified",
          joinDate: new Date(user.created_at).toISOString().split('T')[0],
        }} />
      </main>
    </div>
  )
}
