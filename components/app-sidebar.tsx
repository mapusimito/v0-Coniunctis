import { LayoutDashboard, Settings, Users, ShoppingCart, ClipboardList } from "lucide-react"

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
      title: "Products",
      url: "/dashboard/products",
      icon: ShoppingCart,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ClipboardList,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Settings",
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
