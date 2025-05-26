import type React from "react"
import Sidebar from "@/app/ui/dashboard/sidebar/sidebar"
import { Breadcrumbs } from "@/app/ui/breadcrumbs"
import { lusitana } from "@/app/ui/fonts"

export default function Layout({ children }: { children: React.ReactNode }) {
  const segments = [] // Replace with actual segment retrieval logic if needed

  const breadcrumbs = [{ label: "Inicio", href: "/dashboard" }]

  return (
    <div className="flex h-screen flex-row md:overflow-hidden">
      <div className="w-56">
        <Sidebar />
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="h-full w-full p-4 md:px-6">
          <div className="mb-6 flex w-full grow flex-col gap-4">
            <h1 className={`${lusitana.className} mb-3 text-xl md:text-2xl`}>Dashboard</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs} />
            <main className="flex grow flex-col gap-4 md:p-8 pt-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
