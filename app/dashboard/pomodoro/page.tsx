"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Play, Pause, RotateCcw, Clock, Plus, CheckSquare, Target } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
// Update the import to use your existing supabaseClient.ts file
import { supabase } from "@/lib/supabaseClient"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  estimated_pomodoros: number
  actual_pomodoros: number
}

export default function PomodoroPage() {
  const { user } = useAuth()
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState<"work" | "shortBreak" | "longBreak">("work")
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")
  const [newTaskCategory, setNewTaskCategory] = useState("general")
  const [newTaskEstimate, setNewTaskEstimate] = useState("1")

  const sessionDurations = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }

  const sessionLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  }

  const sessionColors = {
    work: "text-primary",
    shortBreak: "text-secondary",
    longBreak: "text-green-600",
  }

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      handleSessionComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const handleSessionComplete = async () => {
    if (currentSession === "work" && activeTask) {
      // Update actual pomodoros for the active task
      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            actual_pomodoros: activeTask.actual_pomodoros + 1,
          })
          .eq("id", activeTask.id)

        if (error) throw error

        // Update local state
        setTasks(
          tasks.map((task) =>
            task.id === activeTask.id ? { ...task, actual_pomodoros: task.actual_pomodoros + 1 } : task,
          ),
        )

        setActiveTask((prev) => (prev ? { ...prev, actual_pomodoros: prev.actual_pomodoros + 1 } : null))

        // Record the session
        await supabase.from("pomodoro_sessions").insert({
          user_id: user?.id,
          task_id: activeTask.id,
          duration: 25,
          session_type: "work",
          completed: true,
          completed_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error updating task:", error)
      }

      // Auto-switch to break
      const completedSessions = activeTask.actual_pomodoros + 1
      if (completedSessions % 4 === 0) {
        setCurrentSession("longBreak")
        setTimeLeft(sessionDurations.longBreak)
      } else {
        setCurrentSession("shortBreak")
        setTimeLeft(sessionDurations.shortBreak)
      }
    } else {
      setCurrentSession("work")
      setTimeLeft(sessionDurations.work)
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user?.id,
          title: newTaskTitle,
          priority: newTaskPriority,
          category: newTaskCategory,
          estimated_pomodoros: Number.parseInt(newTaskEstimate),
        })
        .select()
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTaskTitle("")
      setNewTaskPriority("medium")
      setNewTaskCategory("general")
      setNewTaskEstimate("1")
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const toggleTaskComplete = async (task: Task) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", task.id)

      if (error) throw error

      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)))

      if (activeTask?.id === task.id && !task.completed) {
        setActiveTask(null)
        setIsRunning(false)
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(sessionDurations[currentSession])
  }

  const switchSession = (session: "work" | "shortBreak" | "longBreak") => {
    setCurrentSession(session)
    setTimeLeft(sessionDurations[session])
    setIsRunning(false)
  }

  const progressPercentage = ((sessionDurations[currentSession] - timeLeft) / sessionDurations[currentSession]) * 100

  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  const totalEstimatedPomodoros = activeTasks.reduce((sum, task) => sum + task.estimated_pomodoros, 0)
  const totalActualPomodoros = tasks.reduce((sum, task) => sum + task.actual_pomodoros, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
        <p className="text-gray-600">Focus on your tasks with the Pomodoro Technique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="flex items-center justify-center space-x-2">
                <Clock className={`w-6 h-6 ${sessionColors[currentSession]}`} />
                <CardTitle className={sessionColors[currentSession]}>{sessionLabels[currentSession]}</CardTitle>
              </div>
              <CardDescription>
                {activeTask ? `Working on: ${activeTask.title}` : "Select a task to start focusing"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`text-8xl font-bold ${sessionColors[currentSession]} mb-4`}>{formatTime(timeLeft)}</div>

              <Progress value={progressPercentage} className="h-3" />

              <div className="flex justify-center space-x-4">
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!activeTask && currentSession === "work"}
                >
                  {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button size="lg" variant="outline" onClick={resetTimer}>
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex justify-center space-x-2">
                <Button
                  variant={currentSession === "work" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchSession("work")}
                >
                  Work
                </Button>
                <Button
                  variant={currentSession === "shortBreak" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchSession("shortBreak")}
                >
                  Short Break
                </Button>
                <Button
                  variant={currentSession === "longBreak" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchSession("longBreak")}
                >
                  Long Break
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>Select a task to work on</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>Add a new task with estimated pomodoros</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Task Title</Label>
                        <Input
                          id="task-title"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="work">Work</SelectItem>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimate">Estimated Pomodoros</Label>
                        <Select value={newTaskEstimate} onValueChange={setNewTaskEstimate}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createTask} className="w-full">
                        Create Task
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeTask?.id === task.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTask(task)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskComplete(task)
                    }}
                  >
                    <CheckSquare className="w-5 h-5 text-gray-400 hover:text-primary" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">
                      🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                    </div>
                    <Progress
                      value={(task.actual_pomodoros / task.estimated_pomodoros) * 100}
                      className="w-16 h-2 mt-1"
                    />
                  </div>
                </div>
              ))}

              {activeTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active tasks. Create one to start focusing!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Today's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-secondary" />
                <span>Today's Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Tasks</span>
                <Badge variant="secondary">{activeTasks.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed Tasks</span>
                <Badge variant="default">{completedTasks.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Pomodoros</span>
                <span className="font-semibold">{totalActualPomodoros}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Focus Time</span>
                <span className="font-semibold">
                  {Math.floor((totalActualPomodoros * 25) / 60)}h {(totalActualPomodoros * 25) % 60}m
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <span>Completed Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through text-gray-600">{task.title}</p>
                    </div>
                    <span className="text-xs text-gray-500">🍅 {task.actual_pomodoros}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Pomodoro Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">🍅 Work for 25 minutes</p>
                <p className="text-gray-600">Focus on a single task without distractions</p>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">☕ Take 5-minute breaks</p>
                <p className="text-gray-600">Step away from your workspace and relax</p>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">🎯 Track your progress</p>
                <p className="text-gray-600">See how many pomodoros each task actually takes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
