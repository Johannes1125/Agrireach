"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Users,
  MessageSquare,
  Package,
  AlertTriangle,
  Settings,
  BarChart3,
  Menu,
  ChevronLeft,
  LogOut,
  ShieldCheck,
} from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/admin",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
    badge: null,
  },
  {
    name: "Community Content",
    href: "/admin/content/community",
    icon: MessageSquare,
    badge: 12,
    badgeKey: "badge:community",
  },
  {
    name: "Marketplace Content",
    href: "/admin/content/marketplace",
    icon: Package,
    badge: 5,
    badgeKey: "badge:marketplace",
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: AlertTriangle,
    badge: 8,
    badgeKey: "badge:reports",
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  // Persistent badge counts that can be updated by other parts of the app
  const [badges, setBadges] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    navigation.forEach((n: any) => {
      if (n.badgeKey) {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(n.badgeKey) : null
        initial[n.badgeKey] = stored !== null ? Number(stored) : (n.badge || 0)
      }
    })
    return initial
  })
  const handleLogout = () => {
    toast.success("Logged out successfully")
    router.push("/admin/login")
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm text-sidebar-foreground">AgriReach</span>
              <span className="text-xs text-sidebar-foreground/60">Admin Panel</span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 sidebar-scroll">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  setMobileOpen(false)
                  if ((item as any).badgeKey) {
                    const key = (item as any).badgeKey as string
                    setBadges((prev) => {
                      const next = { ...prev, [key]: 0 }
                      if (typeof window !== 'undefined') window.localStorage.setItem(key, '0')
                      return next
                    })
                  }
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && (item as any).badgeKey && (badges[(item as any).badgeKey as string] || 0) > 0 && (
                  <Badge variant={isActive ? "secondary" : "default"} className="text-xs">
                    {badges[(item as any).badgeKey as string]}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Link
          href="/admin/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
            pathname === "/admin/settings" && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
            collapsed && "justify-center px-2",
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <Button
          variant="ghost"
          onClick={() => setShowLogoutDialog(true)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block", collapsed ? "w-16" : "w-64", className)}>
        <div className="fixed inset-y-0 left-0 z-50" style={{ width: collapsed ? "4rem" : "16rem" }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-background/95 backdrop-blur-sm border border-border shadow-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout from Admin Panel</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogCancel>Cancel</DialogCancel>
            <DialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">
              Logout
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
