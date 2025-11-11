"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Home,
  Briefcase,
  ShoppingBag,
  MessageSquare,
  Star,
  User,
  Settings,
  Menu,
  ChevronLeft,
  Sprout,
  LogOut,
  MessageCircle,
  BookOpen,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Opportunities", href: "/opportunities", icon: Briefcase },
  { name: "Producers", href: "/producers", icon: Users },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Community", href: "/community", icon: MessageSquare },
  { name: "Learning", href: "/learning", icon: BookOpen },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Profile", href: "/profile", icon: User },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link
          href="/"
          className={cn(
            "flex items-center transition-all duration-500",
            collapsed ? "justify-center gap-0 px-0" : "gap-2"
          )}
          aria-label="Go to home page"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-4 w-4" aria-hidden="true" />
          </div>

          <span
            className={cn(
              "font-heading font-bold text-lg text-sidebar-foreground overflow-hidden whitespace-nowrap transition-[opacity,max-width,margin] duration-500",
              collapsed
                ? "opacity-0 max-w-0 ml-0"
                : "opacity-100 max-w-[8rem] ml-2"
            )}
            style={{ willChange: "opacity, max-width" }}
          >
            AgriReach
          </span>
        </Link>
<Button
  variant="ghost"
  size="sm"
  onClick={() => setCollapsed(!collapsed)}
  className={cn(
    "hidden lg:flex h-8 w-8 p-0 absolute -right-4 top-4 z-50 rounded-full border bg-background shadow-sm transition-all duration-300 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    collapsed ? "rotate-180" : ""
  )}
  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  aria-pressed={collapsed}
>
  <ChevronLeft
    className={cn(
      "h-4 w-4 transition-transform duration-300",
      collapsed && "rotate-180"
    )}
    aria-hidden="true"
  />
</Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 sidebar-scroll">
        <nav aria-label="Main navigation" className="space-y-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  // Container clipped to prevent hover bleed
                  "relative z-0 overflow-hidden rounded-lg block group",
                  // keep active background if selected
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.name : undefined}
              >
                {/* hover background (underneath content) */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-sidebar-accent/80 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-0"
                />

                {/* visible content above hover background */}
                <span
                  className={cn(
                    "relative z-10 flex items-center text-sm font-medium transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:text-sidebar-accent-foreground",
                    collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"
                  )}
                >
                  <item.icon
                    className="h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{item.name}</span>}
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "relative z-0 overflow-hidden rounded-lg block group text-sidebar-foreground",
            collapsed ? "w-full flex justify-center" : ""
          )}
          aria-label={collapsed ? "Settings" : undefined}
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-sidebar-accent/80 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-0"
          />
          {collapsed ? (
            <span className="relative z-10 flex items-center justify-center p-3">
              <Settings className="h-6 w-6" aria-hidden="true" />
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-3 px-3 py-2.5">
              <Settings className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>Settings</span>
            </span>
          )}
        </Link>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full relative z-0 overflow-hidden rounded-lg group",
                "text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              aria-label={collapsed ? "Logout" : undefined}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-sidebar-accent/80 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-0"
              />
              <span className="relative z-10 flex items-center gap-3 px-3 py-2.5">
                <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>Logout</span>}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to logout?</DialogTitle>
              <DialogDescription>
                You will be signed out of your account and redirected to the
                login page.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogCancel>Cancel</DialogCancel>
              <DialogAction>
                <Link href="/auth/login">Logout</Link>
              </DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block overflow-hidden duration-500 ease-in-out transition-[width]",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        <div
          className="fixed inset-y-0 left-0 z-50 overflow-hidden duration-500 ease-in-out transition-[width]"
          style={{ width: collapsed ? "4rem" : "16rem" }}
        >
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
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
