"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, CheckSquare, Clock, TrendingUp, Target, Calendar, Zap, Award } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const [timeRange, setTimeRange] = useState("week")
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalPomodoros: 0,
    focusTimeHours: 0,
    weeklyProgress: 0,
    averageWordsPerDay: 0,
    productivityScore: 0,
    streakDays: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [projectStats, setProjectStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    try {
      const now = new Date()
      const startDate = new Date()

      switch (timeRange) {
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Fetch document stats
      const { count: documentCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)

      const { data: documentsData } = await supabase
        .from("documents")
        .select("word_count, created_at, project_tag, progress_percentage")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString())

      // Fetch task stats
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("completed, actual_pomodoros, created_at, category")
        .eq("user_id", user?.id)

      const { data: recentTasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString())

      // Fetch pomodoro sessions
      const { data: pomodoroData } = await supabase
        .from("pomodoro_sessions")
        .select("duration, completed_at")
        .eq("user_id", user?.id)
        .gte("completed_at", startDate.toISOString())

      // Calculate stats
      const totalTasks = tasksData?.length || 0
      const completedTasks = tasksData?.filter((task) => task.completed).length || 0
      const totalPomodoros = tasksData?.reduce((sum, task) => sum + (task.actual_pomodoros || 0), 0) || 0
      const totalWords = documentsData?.reduce((sum, doc) => sum + (doc.word_count || 0), 0) || 0
      const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      // Calculate productivity score (0-100)
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const avgPomodorosPerDay = totalPomodoros / daysInRange
      const avgWordsPerDay = totalWords / daysInRange
      const productivityScore = Math.min(
        100,
        Math.round(
          taskCompletionRate * 0.4 + Math.min(avgPomodorosPerDay * 10, 40) + Math.min(avgWordsPerDay / 50, 20),
        ),
      )

      // Calculate streak
      const streakDays = calculateStreak(recentTasksData || [])

      // Project statistics
      const projectMap = new Map()
      documentsData?.forEach((doc) => {
        const project = doc.project_tag || "General"
        if (!projectMap.has(project)) {
          projectMap.set(project, { documents: 0, words: 0, avgProgress: 0 })
        }
        const stats = projectMap.get(project)
        stats.documents++
        stats.words += doc.word_count || 0
        stats.avgProgress += doc.progress_percentage || 0
      })

      const projectStatsArray = Array.from(projectMap.entries()).map(([name, stats]) => ({
        name,
        documents: stats.documents,
        words: stats.words,
        avgProgress: Math.round(stats.avgProgress / stats.documents),
      }))

      // Generate chart data for the last 7 days
      const chartDataArray = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]

        const dayTasks = recentTasksData?.filter((task) => task.created_at.startsWith(dateStr)).length || 0

        const dayPomodoros = pomodoroData?.filter((session) => session.completed_at.startsWith(dateStr)).length || 0

        chartDataArray.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          tasks: dayTasks,
          pomodoros: dayPomodoros,
        })
      }

      setStats({
        totalDocuments: documentCount || 0,
        totalTasks,
        completedTasks,
        totalPomodoros,
        focusTimeHours: (totalPomodoros * 25) / 60,
        weeklyProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        averageWordsPerDay: Math.round(avgWordsPerDay),
        productivityScore,
        streakDays,
      })

      setChartData(chartDataArray)
      setProjectStats(projectStatsArray)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (tasks: any[]) => {
    if (tasks.length === 0) return 0

    const today = new Date()
    let streak = 0
    const currentDate = new Date(today)

    while (streak < 30) {
      // Max 30 days to check
      const dateStr = currentDate.toISOString().split("T")[0]
      const hasActivity = tasks.some((task) => task.created_at.startsWith(dateStr))

      if (hasActivity) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-600", emoji: "🚀" }
    if (score >= 60) return { level: "Good", color: "text-blue-600", emoji: "💪" }
    if (score >= 40) return { level: "Average", color: "text-yellow-600", emoji: "📈" }
    return { level: "Needs Improvement", color: "text-red-600", emoji: "🎯" }
  }

  const productivity = getProductivityLevel(stats.productivityScore)

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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your productivity and progress over time</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Productivity Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-primary" />
            <span>Productivity Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{stats.productivityScore}</div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{productivity.emoji}</span>
                <span className={`font-semibold ${productivity.color}`}>{productivity.level}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-secondary" />
                <span className="font-semibold">{stats.streakDays} day streak</span>
              </div>
              <p className="text-sm text-gray-600">Keep up the great work!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Created</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-gray-600">{stats.averageWordsPerDay} words/day avg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-gray-600">Out of {stats.totalTasks} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.focusTimeHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-600">{stats.totalPomodoros} pomodoros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.weeklyProgress)}%</div>
            <p className="text-xs text-gray-600">Task completion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Weekly Activity</span>
            </CardTitle>
            <CardDescription>Your daily tasks and pomodoro sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((day, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium">{day.date}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Tasks: {day.tasks}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-sm">Pomodoros: {day.pomodoros}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-secondary" />
              <span>Project Breakdown</span>
            </CardTitle>
            <CardDescription>Progress across different projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectStats.length > 0 ? (
              projectStats.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="outline">{project.avgProgress}%</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {project.documents} documents • {project.words.toLocaleString()} words
                  </div>
                  <Progress value={project.avgProgress} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No project data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
