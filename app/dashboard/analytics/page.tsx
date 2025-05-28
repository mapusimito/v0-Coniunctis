"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, TrendingUp, Target, Calendar, Zap, Award, BarChart3, PieChart, Activity, Timer } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { Rocket, ThumbsUp, TrendingUp, Target } from "lucide-react"

interface PomodoroSession {
  id: string
  duration: number
  completed_at: string
  session_type: string
  task_id?: string
  task?: {
    title: string
    category: string
    priority: string
  }
}

interface DailyStats {
  date: string
  pomodoros: number
  focus_time: number
  tasks_completed: number
  efficiency: number
}

interface CategoryStats {
  category: string
  pomodoros: number
  focus_time: number
  tasks: number
  color: string
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const [timeRange, setTimeRange] = useState("week")
  const [loading, setLoading] = useState(true)

  // Stats state
  const [overallStats, setOverallStats] = useState({
    totalPomodoros: 0,
    totalFocusTime: 0,
    averageSessionLength: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalTasks: 0,
    completedTasks: 0,
    productivityScore: 0,
  })

  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [recentSessions, setRecentSessions] = useState<PomodoroSession[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState({
    thisWeek: { pomodoros: 0, focusTime: 0 },
    lastWeek: { pomodoros: 0, focusTime: 0 },
    change: { pomodoros: 0, focusTime: 0 },
  })

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchOverallStats(),
        fetchDailyStats(),
        fetchCategoryStats(),
        fetchRecentSessions(),
        fetchWeeklyTrends(),
      ])
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverallStats = async () => {
    const now = new Date()
    const startDate = getStartDate(timeRange)

    // Fetch pomodoro sessions
    const { data: sessions } = await supabase
      .from("pomodoro_sessions")
      .select("duration, completed_at, session_type")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("completed_at", startDate.toISOString())

    // Fetch tasks
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("completed, actual_pomodoros, estimated_pomodoros")
      .eq("user_id", user?.id)

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("updated_at", startDate.toISOString())

    const totalPomodoros = sessions?.length || 0
    const totalFocusTime = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0
    const averageSessionLength = totalPomodoros > 0 ? totalFocusTime / totalPomodoros : 0

    const totalTasks = allTasks?.length || 0
    const completedTasksCount = completedTasks?.length || 0
    const completionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0

    // Calculate productivity score
    const taskEfficiency =
      allTasks?.reduce((acc, task) => {
        if (task.estimated_pomodoros > 0) {
          return acc + Math.min(task.actual_pomodoros / task.estimated_pomodoros, 2)
        }
        return acc
      }, 0) || 0

    const avgEfficiency = allTasks?.length > 0 ? taskEfficiency / allTasks.length : 1
    const productivityScore = Math.min(
      100,
      Math.round(completionRate * 0.4 + Math.min(totalPomodoros / 7, 10) * 4 + avgEfficiency * 20),
    )

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(sessions || [])

    setOverallStats({
      totalPomodoros,
      totalFocusTime,
      averageSessionLength,
      completionRate,
      currentStreak,
      longestStreak,
      totalTasks,
      completedTasks: completedTasksCount,
      productivityScore,
    })
  }

  const fetchDailyStats = async () => {
    const startDate = getStartDate(timeRange)
    const days = getDaysInRange(timeRange)

    const { data: sessions } = await supabase
      .from("pomodoro_sessions")
      .select("duration, completed_at")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("completed_at", startDate.toISOString())

    const { data: tasks } = await supabase
      .from("tasks")
      .select("updated_at, actual_pomodoros, estimated_pomodoros")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("updated_at", startDate.toISOString())

    const dailyData: DailyStats[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const dayPomodoros = sessions?.filter((s) => s.completed_at.startsWith(dateStr)).length || 0

      const dayFocusTime =
        sessions?.filter((s) => s.completed_at.startsWith(dateStr)).reduce((sum, s) => sum + s.duration, 0) || 0

      const dayTasks = tasks?.filter((t) => t.updated_at.startsWith(dateStr)).length || 0

      const dayTasksWithPomodoros = tasks?.filter((t) => t.updated_at.startsWith(dateStr)) || []

      const efficiency =
        dayTasksWithPomodoros.length > 0
          ? (dayTasksWithPomodoros.reduce((acc, task) => {
              if (task.estimated_pomodoros > 0) {
                return acc + Math.min(task.actual_pomodoros / task.estimated_pomodoros, 2)
              }
              return acc + 1
            }, 0) /
              dayTasksWithPomodoros.length) *
            100
          : 0

      dailyData.push({
        date: dateStr,
        pomodoros: dayPomodoros,
        focus_time: dayFocusTime,
        tasks_completed: dayTasks,
        efficiency: Math.round(efficiency),
      })
    }

    setDailyStats(dailyData)
  }

  const fetchCategoryStats = async () => {
    const startDate = getStartDate(timeRange)

    const { data: sessions } = await supabase
      .from("pomodoro_sessions")
      .select(`
        duration,
        tasks (
          category,
          title
        )
      `)
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("completed_at", startDate.toISOString())

    const { data: tasks } = await supabase
      .from("tasks")
      .select("category, actual_pomodoros")
      .eq("user_id", user?.id)
      .gte("updated_at", startDate.toISOString())

    const categoryMap = new Map<string, { pomodoros: number; focusTime: number; tasks: number }>()
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

    // Process sessions
    sessions?.forEach((session) => {
      const category = session.tasks?.category || "Sin categoría"
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { pomodoros: 0, focusTime: 0, tasks: 0 })
      }
      const stats = categoryMap.get(category)!
      stats.pomodoros += 1
      stats.focusTime += session.duration
    })

    // Process tasks
    tasks?.forEach((task) => {
      const category = task.category || "Sin categoría"
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { pomodoros: 0, focusTime: 0, tasks: 0 })
      }
      const stats = categoryMap.get(category)!
      stats.tasks += 1
    })

    const categoryStatsArray = Array.from(categoryMap.entries()).map(([category, stats], index) => ({
      category,
      pomodoros: stats.pomodoros,
      focus_time: stats.focusTime,
      tasks: stats.tasks,
      color: colors[index % colors.length],
    }))

    setCategoryStats(categoryStatsArray)
  }

  const fetchRecentSessions = async () => {
    const { data: sessions } = await supabase
      .from("pomodoro_sessions")
      .select(`
        id,
        duration,
        completed_at,
        session_type,
        task_id,
        tasks (
          title,
          category,
          priority
        )
      `)
      .eq("user_id", user?.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(10)

    setRecentSessions(
      sessions?.map((session) => ({
        ...session,
        task: session.tasks,
      })) || [],
    )
  }

  const fetchWeeklyTrends = async () => {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)

    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setMilliseconds(-1)

    // This week
    const { data: thisWeekSessions } = await supabase
      .from("pomodoro_sessions")
      .select("duration")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("completed_at", thisWeekStart.toISOString())

    // Last week
    const { data: lastWeekSessions } = await supabase
      .from("pomodoro_sessions")
      .select("duration")
      .eq("user_id", user?.id)
      .eq("completed", true)
      .gte("completed_at", lastWeekStart.toISOString())
      .lt("completed_at", lastWeekEnd.toISOString())

    const thisWeekPomodoros = thisWeekSessions?.length || 0
    const thisWeekFocusTime = thisWeekSessions?.reduce((sum, s) => sum + s.duration, 0) || 0
    const lastWeekPomodoros = lastWeekSessions?.length || 0
    const lastWeekFocusTime = lastWeekSessions?.reduce((sum, s) => sum + s.duration, 0) || 0

    setWeeklyTrends({
      thisWeek: { pomodoros: thisWeekPomodoros, focusTime: thisWeekFocusTime },
      lastWeek: { pomodoros: lastWeekPomodoros, focusTime: lastWeekFocusTime },
      change: {
        pomodoros: lastWeekPomodoros > 0 ? ((thisWeekPomodoros - lastWeekPomodoros) / lastWeekPomodoros) * 100 : 0,
        focusTime: lastWeekFocusTime > 0 ? ((thisWeekFocusTime - lastWeekFocusTime) / lastWeekFocusTime) * 100 : 0,
      },
    })
  }

  const getStartDate = (range: string) => {
    const now = new Date()
    switch (range) {
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        return weekStart
      case "month":
        const monthStart = new Date(now)
        monthStart.setMonth(now.getMonth() - 1)
        return monthStart
      case "year":
        const yearStart = new Date(now)
        yearStart.setFullYear(now.getFullYear() - 1)
        return yearStart
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const getDaysInRange = (range: string) => {
    switch (range) {
      case "week":
        return 7
      case "month":
        return 30
      case "year":
        return 365
      default:
        return 7
    }
  }

  const calculateStreaks = (sessions: any[]) => {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 }

    const sessionDates = sessions.map((s) => s.completed_at.split("T")[0])
    const uniqueDates = [...new Set(sessionDates)].sort().reverse()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toISOString().split("T")[0]
    const checkDate = new Date()

    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split("T")[0]
      if (uniqueDates.includes(dateStr)) {
        currentStreak++
      } else if (dateStr !== today) {
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const currentDate = new Date(uniqueDates[i])
        const prevDate = new Date(uniqueDates[i - 1])
        const diffDays = Math.abs((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getProductivityLevel = (score: number) => {
    if (score >= 80)
      return {
        level: "Excelente",
        color: "text-green-500",
        icon: <Rocket className="inline w-6 h-6 text-green-500" />,
      }
    if (score >= 60)
      return {
        level: "Bueno",
        color: "text-sky-500",
        icon: <ThumbsUp className="inline w-6 h-6 text-sky-500" />,
      }
    if (score >= 40)
      return {
        level: "Regular",
        color: "text-yellow-500",
        icon: <TrendingUp className="inline w-6 h-6 text-yellow-500" />,
      }
    return {
      level: "Necesita Mejora",
      color: "text-red-500",
      icon: <Target className="inline w-6 h-6 text-red-500" />,
    }
  }
  }

  const productivity = getProductivityLevel(overallStats.productivityScore)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Estadísticas de Productividad</h1>
          <p className="text-gray-600">Análisis detallado de tu rendimiento con Pomodoro</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mes</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Productivity Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-primary" />
            <span>Puntuación de Productividad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">{overallStats.productivityScore}</div>
              <div className="flex items-center space-x-2">
                <span className="text-3xl">{productivity.emoji}</span>
                <span className={`font-semibold text-lg ${productivity.color}`}>{productivity.level}</span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-secondary" />
                <span className="font-semibold">{overallStats.currentStreak} días consecutivos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Mejor racha: {overallStats.longestStreak} días</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Tendencia Semanal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pomodoros esta semana</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{weeklyTrends.thisWeek.pomodoros}</span>
                <Badge variant={weeklyTrends.change.pomodoros >= 0 ? "default" : "destructive"}>
                  {weeklyTrends.change.pomodoros >= 0 ? "+" : ""}
                  {Math.round(weeklyTrends.change.pomodoros)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tiempo de enfoque</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatTime(weeklyTrends.thisWeek.focusTime)}</span>
                <Badge variant={weeklyTrends.change.focusTime >= 0 ? "default" : "destructive"}>
                  {weeklyTrends.change.focusTime >= 0 ? "+" : ""}
                  {Math.round(weeklyTrends.change.focusTime)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Resumen General</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Pomodoros</span>
              <span className="font-semibold">{overallStats.totalPomodoros}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tiempo Total</span>
              <span className="font-semibold">{formatTime(overallStats.totalFocusTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tasa de Finalización</span>
              <span className="font-semibold">{Math.round(overallStats.completionRate)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Actividad Diaria</TabsTrigger>
          <TabsTrigger value="categories">Por Categorías</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones Recientes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Actividad Diaria</span>
              </CardTitle>
              <CardDescription>Tu progreso día a día en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
          {dailyStats.slice(-7).map((day, index) => (
            <div key={day.date} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium">
                {new Date(day.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{day.pomodoros} pomodoros</span>
            </span>
            <span>{formatTime(day.focus_time)}</span>
                </div>
                <Progress value={Math.min((day.pomodoros / 8) * 100, 100)} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Check className="w-4 h-4 text-green-500" />
              <span>{day.tasks_completed} tareas</span>
            </span>
            <span>Eficiencia: {day.efficiency}%</span>
                </div>
              </div>
            </div>
          ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-secondary" />
          <span>Distribución por Categorías</span>
              </CardTitle>
              <CardDescription>Cómo distribuyes tu tiempo entre diferentes tipos de trabajo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4"></CardContent>
              {categoryStats.length > 0 ? (
          categoryStats.map((category, index) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="font-medium">{category.category}</span>
                </div>
                <Badge variant="outline">
            <Clock className="w-4 h-4 text-red-500 mr-1 inline" />
            {category.pomodoros}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 ml-6">
                {formatTime(category.focus_time)} • 
                <span className="inline-flex items-center ml-1">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            {category.tasks} tareas
                </span>
              </div>
              <Progress
                value={(category.pomodoros / Math.max(...categoryStats.map((c) => c.pomodoros))) * 100}
                className="h-2 ml-6"
              />
            </div>
          ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay datos de categorías disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Sesiones Recientes</span>
              </CardTitle>
              <CardDescription>Tus últimas sesiones de pomodoro completadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Timer className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{session.task?.title || "Sesión sin tarea específica"}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{formatTime(session.duration)}</span>
                        {session.task?.category && (
                          <>
                            <span>•</span>
                            <span>{session.task.category}</span>
                          </>
                        )}
                        {session.task?.priority && (
                          <Badge
                            variant={
                              session.task.priority === "high"
                                ? "destructive"
                                : session.task.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {session.task.priority === "high"
                              ? "Alta"
                              : session.task.priority === "medium"
                                ? "Media"
                                : "Baja"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.completed_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay sesiones recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Patrones de Tiempo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duración promedio de sesión</span>
                    <span className="font-semibold">{Math.round(overallStats.averageSessionLength)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pomodoros por día (promedio)</span>
                    <span className="font-semibold">
                      {Math.round(overallStats.totalPomodoros / Math.max(dailyStats.length, 1))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mejor día</span>
                    <span className="font-semibold">
                      {dailyStats.length > 0 ? Math.max(...dailyStats.map((d) => d.pomodoros)) + " 🍅" : "0 🍅"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>Eficiencia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tasa de finalización</span>
                    <span className="font-semibold">{Math.round(overallStats.completionRate)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tareas completadas</span>
                    <span className="font-semibold">
                      {overallStats.completedTasks}/{overallStats.totalTasks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Eficiencia promedio</span>
                    <span className="font-semibold">
                      {dailyStats.length > 0
                        ? Math.round(dailyStats.reduce((sum, d) => sum + d.efficiency, 0) / dailyStats.length)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>Recomendaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overallStats.currentStreak === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">
                      <strong>💡 Consejo:</strong> Intenta hacer al menos un pomodoro hoy para comenzar una nueva racha.
                    </p>
                  </div>
                )}
                {overallStats.completionRate < 50 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">
                      <strong>📈 Mejora:</strong> Tu tasa de finalización es baja. Considera dividir las tareas grandes
                      en partes más pequeñas.
                    </p>
                  </div>
                )}
                {overallStats.averageSessionLength < 20 && overallStats.totalPomodoros > 5 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">
                      <strong>⏰ Observación:</strong> Tus sesiones son más cortas que el promedio. Asegúrate de
                      configurar la duración correcta.
                    </p>
                  </div>
                )}
                {overallStats.productivityScore >= 80 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">
                      <strong>🎉 ¡Excelente!</strong> Tienes una productividad muy alta. ¡Sigue así!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
