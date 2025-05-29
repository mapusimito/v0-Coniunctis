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
  FileText,
  FilePlus,
  Home, // Cambia House por Home
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
import clsx from "clsx"

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Editor", href: "/dashboard/editor", icon: FilePlus },
  { name: "Documentos", href: "/dashboard/documents", icon: FileText },
  { name: "Tareas", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Pomo", href: "/dashboard/pomodoro", icon: Clock },         // Compactado
  { name: "Stats", href: "/dashboard/analytics", icon: BarChart3 },   // Compactado
]

// BottomNavBar solo para móvil, ahora con nombres compactos y mejor alineación
function BottomNavBar({ items, pathname }: { items: typeof navigation; pathname: string }) {
  const { theme, setTheme } = useTheme()

  // Ordena los items para que "Inicio" (Home) esté en el centro SIEMPRE
  const homeIndex = items.findIndex((item) => item.icon === Home)
  let navItems = [...items]
  if (homeIndex !== -1) {
    const [homeItem] = navItems.splice(homeIndex, 1)
    const middle = Math.floor(navItems.length / 2)
    navItems.splice(middle, 0, homeItem)
  }

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 w-[98vw] max-w-md flex justify-center pointer-events-none">
      <div className="relative w-full flex justify-center pointer-events-auto">
        {/* Fondo del navbar con bordes redondeados */}
        <div className="absolute inset-0 flex justify-center items-end z-0">
          <div className="w-full h-14 bg-background border border-border rounded-2xl shadow-lg" />
        </div>
        {/* Botones */}
        <div className="relative flex w-full z-20">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-end py-1 transition-all duration-200",
                  "relative z-20",
                  isActive ? "font-semibold" : "font-normal"
                )}
                style={{
                  marginTop: isActive ? -18 : 0,
                  transition: "margin-top 0.3s cubic-bezier(.4,1.7,.7,1)",
                }}
              >
                <div
                  className={clsx(
                    "flex flex-col items-center justify-center rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-lg"
                      : "text-muted-foreground"
                  )}
                  style={{
                    width: isActive ? 44 : 36,
                    height: isActive ? 44 : 36,
                    marginBottom: 2,
                    zIndex: 30,
                  }}
                >
                  <Icon className={clsx("transition-all", isActive ? "w-6 h-6" : "w-5 h-5")} />
                </div>
                <span
                  className={clsx(
                    "text-[10px] mt-0.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  style={{
                    fontSize: isActive ? 11 : 10,
                  }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
          {/* Botón de modo oscuro/claro */}
          <button
            aria-label="Cambiar modo"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 flex flex-col items-center justify-end py-1"
            type="button"
            tabIndex={0}
            style={{
              marginTop: 0,
            }}
          >
            <div className="flex flex-col items-center justify-center rounded-full text-muted-foreground w-9 h-9 mb-1">
              {theme === "dark" ? (
                <Sun className="w-5 h-5" style={{ marginTop: 2 }} />
              ) : (
                <Moon className="w-5 h-5" style={{ marginTop: 2 }} />
              )}
            </div>
            <span className="text-[10px] mt-0.5 text-muted-foreground">Tema</span>
          </button>
        </div>
      </div>
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
