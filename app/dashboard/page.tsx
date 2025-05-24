"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckSquare, Clock, Plus, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface Document {
  id: string
  title: string
  updated_at: string
  project_tag: string
  progress_percentage: number
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  useEffect(() => {
    if (user) {
      fetchRecentData()
    }
  }, [user])

  const fetchRecentData = async () => {
    try {
      // Fetch 3 most recent documents
      const { data: documentsData } = await supabase
        .from("documents")
        .select("id, title, updated_at, project_tag, progress_percentage")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })
        .limit(3)

      // Fetch 3 most recent tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, completed, priority")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(3)

      setRecentDocuments(documentsData || [])
      setRecentTasks(tasksData || [])
    } catch (error) {
      console.error("Error fetching recent data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    return `${diffInDays} days ago`
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-gray-900">Welcome back, {displayName}! 👋</h1>
        <p className="text-lg text-gray-600">Ready to be productive today?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/editor">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Writing</h3>
              <p className="text-gray-600">Create a new document with AI assistance</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tasks">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-secondary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manage Tasks</h3>
              <p className="text-gray-600">Organize and track your tasks</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pomodoro">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Focus Time</h3>
              <p className="text-gray-600">Start a Pomodoro session</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Documents</CardTitle>
                <CardDescription>Continue where you left off</CardDescription>
              </div>
              <Link href="/dashboard/documents">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.length > 0 ? (
              recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{doc.project_tag}</span>
                        <span>•</span>
                        <span>{getTimeAgo(doc.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">{doc.progress_percentage}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">No documents yet</p>
                <Link href="/dashboard/editor">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Document
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Tasks</CardTitle>
                <CardDescription>Stay on top of your priorities</CardDescription>
              </div>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">No tasks yet</p>
                <Link href="/dashboard/tasks">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Task
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
