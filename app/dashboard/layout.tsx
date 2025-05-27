import type React from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 bg-background">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
