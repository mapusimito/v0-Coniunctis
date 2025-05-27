import { LayoutDashboard, Settings, FileText, CheckSquare, Clock } from "lucide-react"

import type { NavItem } from "@/types"

interface AppSidebarProps {
  isCollapsed: boolean
}

const AppSidebar = ({ isCollapsed }: AppSidebarProps) => {
  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Editor",
      url: "/dashboard/editor",
      icon: FileText,
    },
    {
      title: "Documentos",
      url: "/dashboard/documents",
      icon: FileText,
    },
    {
      title: "Tareas",
      url: "/dashboard/tasks",
      icon: CheckSquare,
    },
    {
      title: "Pomodoro",
      url: "/dashboard/pomodoro",
      icon: Clock,
    },
    {
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className={`w-64 bg-gray-100 h-full p-4 ${isCollapsed ? "w-16" : ""}`}>
      <nav>
        <ul>
          {navigationItems.map((item) => (
            <li key={item.title} className="mb-2">
              <a href={item.url} className="flex items-center p-2 rounded hover:bg-gray-200">
                {item.icon && <item.icon className="mr-2 w-4 h-4" />}
                {!isCollapsed && <span>{item.title}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default AppSidebar
