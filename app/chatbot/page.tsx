import { redirect } from "next/navigation"
import { SimpleHeader } from "@/components/layout/simple-header"
import { ChatbotWindow } from '@/components/chat/chatbot-window'
import { getCurrentUser } from "@/lib/auth-server"

export default async function ChatbotPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <SimpleHeader user={{
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: Array.isArray(user.role) ? user.role[0] : user.role,
        avatar: user.avatar_url || "",
        location: user.location || "Not specified",
      }} />

      <div className="flex-1 flex flex-col px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Chatbot</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Ask me anything about AgriReach</p>
        </div>
        
        <div className="flex-1 min-h-0 bg-card border rounded-lg overflow-hidden">
          <ChatbotWindow />
        </div>
      </div>
    </div>
  )
}

