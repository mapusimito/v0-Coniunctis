import type React from "react"
<<<<<<< Updated upstream
import { ProtectedRoute } from "@/lib/protected-route"
=======
import Sidebar from "@/app/components/ui/sidebar/sidebar"
import { Breadcrumbs } from "@/app/components/ui/breadcrumbs"
import { lusitana } from "@/app/components/ui/fonts"

export default function Layout({ children }: { children: React.ReactNode }) {
  const segments = [] // Replace with actual segment retrieval logic if needed

  const breadcrumbs = [{ label: "Inicio", href: "/dashboard" }]
>>>>>>> Stashed changes

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
