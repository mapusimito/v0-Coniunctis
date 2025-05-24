"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Clock, CheckSquare, Circle, Play, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: string
  category: string
  estimated_pomodoros: number
  actual_pomodoros: number
  created_at: string
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    estimated_pomodoros: 1,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

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
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed: !completed }).eq("id", id)

      if (error) throw error

      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !completed } : task)))
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...newTask,
          user_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "general",
        estimated_pomodoros: 1,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== id))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const activeTasks = tasks.filter((task) => !task.completed)
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

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
        <div>
          <h1 className="text-3xl font-bold">Task Manager</h1>
          <p className="text-gray-600">
            {completedTasks.length} of {totalTasks} tasks completed
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to your list and set its priority.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}
                  >
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
                  <Label>Category</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}
                  >
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
                <Label>Estimated Pomodoros</Label>
                <Select
                  value={newTask.estimated_pomodoros.toString()}
                  onValueChange={(value) => setNewTask((prev) => ({ ...prev, estimated_pomodoros: Number(value) }))}
                >
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
              <Button onClick={addTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span>Overall Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed Tasks</span>
              <span>
                {completedTasks.length}/{totalTasks}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks ({activeTasks.length})</CardTitle>
            <CardDescription>Tasks you're currently working on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                    <Circle className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
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
                      <span className="text-xs text-gray-500">
                        🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks ({completedTasks.length})</CardTitle>
            <CardDescription>Tasks you've finished</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50">
                  <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-through text-gray-600">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-500 line-through">{task.description}</p>}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.category}</span>
                      <span className="text-xs text-gray-500">🍅 {task.actual_pomodoros}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No completed tasks yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
