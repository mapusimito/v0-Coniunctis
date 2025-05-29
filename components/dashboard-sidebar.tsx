"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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
  LayoutDashboard,
  FileText,
  FilePlus,
  House,
  CheckSquare,
  Clock,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Moon,
  Sun,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: House }, // Cambiado a House
  { name: "Editor", href: "/dashboard/editor", icon: FilePlus }, // Cambiado a FilePlus
  { name: "Documentos", href: "/dashboard/documents", icon: FileText }, // Se mantiene FileText
  { name: "Tareas", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Pomodoro", href: "/dashboard/pomodoro", icon: Clock },
  { name: "Estadísticas", href: "/dashboard/analytics", icon: BarChart3 },
]

// BottomNavBar solo para móvil, ahora con botón de modo oscuro
function BottomNavBar({ items, pathname }: { items: typeof navigation; pathname: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around bg-background border-t border-border py-1 md:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            className={`flex flex-col items-center justify-center px-2 py-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className={`w-6 h-6 ${isActive ? "scale-110" : ""}`} />
          </Link>
        )
      })}
      {/* Botón de modo oscuro/claro */}
      <button
        aria-label="Cambiar modo"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex flex-col items-center justify-center px-2 py-1 text-muted-foreground"
        type="button"
      >
        {theme === "dark" ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </button>
    </nav>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isHovering, setIsHovering] = useState(false)
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = ["Dashboard"]

    if (segments.length > 1) {
      const currentPage = segments[segments.length - 1]
      const navItem = navigation.find((item) => item.href.includes(currentPage))
      if (navItem && navItem.href !== "/dashboard") {
        breadcrumbs.push(navItem.name)
      }
    }

    return breadcrumbs.join(" / ")
  }

  // En móvil, mostrar solo el BottomNavBar siempre visible, sin texto, solo iconos
  if (isMobile) {
    return <BottomNavBar items={navigation} pathname={pathname} />
  }

  return (
    <div className={`modern-sidebar flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      {/* Header with Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          {/* Logo grande según tema, ocupa todo el espacio */}
          {!isCollapsed && (
            <div className="w-full flex items-center justify-center">
              <Image
                src={theme === "dark" ? "/images/coniunctis-logo-dark.png" : "/images/coniunctis-logo-light.png"}
                alt="Coniunctis"
                width={180}
                height={48}
                className="object-contain"
                priority
              />
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 relative mx-auto">
              <Image
                src={theme === "dark" ? "/images/coniunctis-logo-dark.png" : "/images/coniunctis-logo-light.png"}
                alt="Coniunctis"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto p-2 hover:bg-muted rounded-lg"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Icono PanelLeft siempre visible, cambia solo en hover */}
            {!isHovering && (
              <PanelLeft className="w-4 h-4 text-muted-foreground" />
            )}
            {isHovering && !isCollapsed && (
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            )}
            {isHovering && isCollapsed && (
              <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {!isCollapsed && (
        <div className="px-6 py-3 border-b border-border/50">
          <p className="text-xs text-muted-foreground truncate">{getBreadcrumbs()}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <div className={`modern-nav-item ${isActive ? "modern-nav-item-active" : ""}`}>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {!isCollapsed && <span className={isActive ? "text-primary" : "text-foreground"}>{item.name}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full hover:bg-muted rounded-lg p-3 ${isCollapsed ? "px-2" : "justify-start"}`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-foreground">{profile?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</p>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 modern-card" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "Usuario"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="cursor-pointer">
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Eliminadas las opciones de Perfil y Configuración */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
