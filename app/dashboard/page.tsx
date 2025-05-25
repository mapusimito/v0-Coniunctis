"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, CheckSquare, Clock, Plus, ArrowRight, TrendingUp, Target, Zap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface Document {
  id: string
  title: string
  updated_at: string
  project_tag: string
  progress_percentage: number
  word_count: number
  status: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
}

interface Stats {
  totalDocuments: number
  totalTasks: number
  completedTasks: number
  todayWords: number
  weekProgress: number
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalTasks: 0,
    completedTasks: 0,
    todayWords: 0,
    weekProgress: 0,
  })
  const [loading, setLoading] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)


  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch recent documents
      const { data: documentsData } = await supabase
        .from("documents")
        .select("id, title, updated_at, project_tag, progress_percentage, word_count, status")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })
        .limit(5)

      // Fetch recent tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, category")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(6)

      // Calculate stats
      const { count: totalDocs } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)

      const { count: totalTasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)

      const { count: completedTasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("completed", true)

      // Calculate today's words
      const today = new Date().toISOString().split("T")[0]
      const { data: todayDocs } = await supabase
        .from("documents")
        .select("word_count")
        .eq("user_id", user?.id)
        .gte("updated_at", today)

      const todayWords = todayDocs?.reduce((sum, doc) => sum + (doc.word_count || 0), 0) || 0

      setRecentDocuments(documentsData || [])
      setRecentTasks(tasksData || [])
      setStats({
        totalDocuments: totalDocs || 0,
        totalTasks: totalTasksCount || 0,
        completedTasks: completedTasksCount || 0,
        todayWords,
        weekProgress: totalTasksCount ? ((completedTasksCount || 0) / totalTasksCount) * 100 : 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed: !completed }).eq("id", taskId)

      if (error) throw error

      // Update local state
      setRecentTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !completed } : task)))

      // Update stats
      setStats((prev) => ({
        ...prev,
        completedTasks: completed ? prev.completedTasks - 1 : prev.completedTasks + 1,
        weekProgress: prev.totalTasks
          ? ((completed ? prev.completedTasks - 1 : prev.completedTasks + 1) / prev.totalTasks) * 100
          : 0,
      }))
    } catch (error) {
      console.error("Error toggling task:", error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Hace un momento"
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "Ayer"
    return `Hace ${diffInDays} días`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">¡Hola, {displayName}! 👋</h1>
        <p className="text-lg text-muted-foreground">¿Listo para ser productivo hoy?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documentos</p>
                <p className="text-3xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tareas Completadas</p>
                <p className="text-3xl font-bold">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
              <CheckSquare className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Palabras Hoy</p>
                <p className="text-3xl font-bold">{stats.todayWords}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progreso Semanal</p>
                <p className="text-3xl font-bold">{Math.round(stats.weekProgress)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/editor">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Crear Documento</h3>
              <p className="text-muted-foreground">Comienza a escribir con asistencia de IA</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tasks">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-secondary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                <CheckSquare className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestionar Tareas</h3>
              <p className="text-muted-foreground">Organiza y rastrea tu progreso</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pomodoro">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-green-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tiempo de Enfoque</h3>
              <p className="text-muted-foreground">Inicia una sesión Pomodoro</p>
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
                <CardTitle className="text-xl">Documentos Recientes</CardTitle>
                <CardDescription>Continúa donde lo dejaste</CardDescription>
              </div>
              <Link href="/dashboard/documents">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver Todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.length > 0 ? (
              recentDocuments.map((doc) => (
                <Link key={doc.id} href={`/dashboard/editor?id=${doc.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {doc.project_tag}
                          </Badge>
                          <span>•</span>
                          <span>{getTimeAgo(doc.updated_at)}</span>
                          <span>•</span>
                          <span>{doc.word_count} palabras</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-primary">{doc.progress_percentage}%</span>
                      <Progress value={doc.progress_percentage} className="w-16 h-2 mt-1" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="mb-4">No hay documentos aún</p>
                <Link href="/dashboard/editor">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Documento
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
                <CardTitle className="text-xl">Tareas Recientes</CardTitle>
                <CardDescription>Mantente al día con tus prioridades</CardDescription>
              </div>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver Todas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="mb-4">No hay tareas aún</p>
                <Link href="/dashboard/tasks">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Tarea
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Tip */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Consejo de Productividad</h3>
              <p className="text-muted-foreground">
                Usa la técnica Pomodoro para mantener el enfoque. 25 minutos de trabajo concentrado seguidos de 5
                minutos de descanso pueden aumentar significativamente tu productividad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
