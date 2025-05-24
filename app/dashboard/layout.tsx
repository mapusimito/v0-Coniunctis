"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  FileText,
  CheckSquare,
  Clock,
  Sparkles,
  Search,
  Plus,
  Settings,
  LogOut,
  Home,
  FolderOpen,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/lib/protected-route"
import { Suspense } from "react"
import { NotificationCenter } from "@/components/notification-center"

const navigation = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "Documents", url: "/dashboard/documents", icon: FolderOpen },
    ],
  },
  {
    title: "Productivity",
    items: [
      { title: "Text Editor", url: "/dashboard/editor", icon: FileText },
      { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
      { title: "Pomodoro", url: "/dashboard/pomodoro", icon: Clock },
    ],
  },
]

function AppSidebar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User"
  const initials = getInitials(displayName)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2 py-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Coniunctis
          </span>
        </div>
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input placeholder="Search..." className="pl-8 h-9" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{displayName}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <NotificationCenter />
            <Link href="/dashboard/editor">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </Link>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
