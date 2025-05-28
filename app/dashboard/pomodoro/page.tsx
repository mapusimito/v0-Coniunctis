"use client"

import { TabsContent } from "@/components/ui/tabs"

import type React from "react"
import { ArrowBigLeft, ArrowBigRight } from "lucide-react" // Import ArrowBigLeft and ArrowBigRight
import { useSettings } from "@/hooks/useSettings" // Declare the useSettings hook

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, Clock, Maximize } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type SessionType = "pomodoro" | "short_break" | "long_break"

const pomodoroDurations = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

export default function Pomodoro() {
  const [currentSession, setCurrentSession] = useState<SessionType>("pomodoro")
  const [timeRemaining, setTimeRemaining] = useState(pomodoroDurations[currentSession])
  const [isRunning, setIsRunning] = useState(false)
  const [cyclePosition, setCyclePosition] = useState(0)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const timerRef = useRef<number | null>(null)
  const { toast } = useToast()
  const { settings, updateSettings } = useSettings() // Import the useSettings hook

  useEffect(() => {
    setTimeRemaining(pomodoroDurations[currentSession])
  }, [currentSession])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (timeRemaining < 0) {
      handleSessionEnd()
    }
  }, [timeRemaining])

  const handleSessionEnd = () => {
    clearInterval(timerRef.current as number)
    setIsRunning(false)

    if (settings.sound_enabled) {
      const audio = new Audio("/sounds/alarm.mp3")
      audio.play()
    }

    if (currentSession === "pomodoro") {
      setCompletedPomodoros((prev) => prev + 1)
    }

    toast({
      title: `${currentSession === "pomodoro" ? "Pomodoro" : currentSession === "short_break" ? "Descanso Corto" : "Descanso Largo"} terminado!`,
      description: "¡Bien hecho! Es hora de un descanso.",
    })

    // Logic to advance the cycle
    if (currentSession === "pomodoro") {
      if ((cyclePosition + 1) % 8 === 0) {
        // After 4 pomodoros, take a long break
        setCurrentSession("long_break")
      } else {
        // Otherwise, take a short break
        setCurrentSession("short_break")
      }
    } else {
      // After a break, start a new pomodoro
      setCurrentSession("pomodoro")
      setCyclePosition((prev) => (prev + 1) % 8)
    }

    setTimeRemaining(pomodoroDurations[currentSession])
  }

  const toggleTimer = () => {
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    clearInterval(timerRef.current as number)
    setIsRunning(false)
    setTimeRemaining(pomodoroDurations[currentSession])
  }

  const getProgressPercentage = () => {
    return (1 - timeRemaining / pomodoroDurations[currentSession]) * 100
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
  }

  const getSessionBg = (session: SessionType) => {
    switch (session) {
      case "pomodoro":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      case "short_break":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "long_break":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
      default:
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
    }
  }

  const getSessionColor = (session: SessionType) => {
    switch (session) {
      case "pomodoro":
        return "text-red-600 dark:text-red-400"
      case "short_break":
        return "text-green-600 dark:text-green-400"
      case "long_break":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-red-600 dark:text-red-400"
    }
  }

  return (
    <div className="container relative py-10">
      <div
        className="absolute top-0 left-0 w-full h-full bg-grid-sm/[0.2] dark:bg-grid-sm/[0.4] z-0 pointer-events-none"
        style={{ clipPath: "url(#grid)" }}
      ></div>
      <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 rounded-lg shadow-md z-10">
        {isFullScreen ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold mb-4">{formatTime(timeRemaining)}</div>
            <Progress
              value={getProgressPercentage()}
              className={`w-96 h-6 mx-auto ${
                currentSession === "pomodoro"
                  ? "[&>div]:bg-red-600 dark:[&>div]:bg-red-500"
                  : currentSession === "short_break"
                    ? "[&>div]:bg-green-600 dark:[&>div]:bg-green-500"
                    : "[&>div]:bg-blue-600 dark:[&>div]:bg-blue-500"
              }`}
            />
            <div className="flex space-x-4 mt-4">
              <Button variant="outline" size="icon" onClick={toggleTimer}>
                {isRunning ? <ArrowBigLeft className="w-6 h-6" /> : <ArrowBigRight className="w-6 h-6" />}
              </Button>
              <Button variant="outline" size="icon" onClick={resetTimer}>
                <Clock className="w-6 h-6" />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs defaultvalue="pomodoro" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pomodoro" className="text-red-600 dark:text-red-400">
                  <Clock className="w-4 h-4 mr-2" />
                  Pomodoro
                </TabsTrigger>
                <TabsTrigger value="short_break" className="text-green-600 dark:text-green-400">
                  <Coffee className="w-4 h-4 mr-2" />
                  Descanso Corto
                </TabsTrigger>
                <TabsTrigger value="long_break" className="text-blue-600 dark:text-blue-400">
                  <Coffee className="w-4 h-4 mr-2" />
                  Descanso Largo
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pomodoro">
                <SessionContent
                  session="pomodoro"
                  timeRemaining={timeRemaining}
                  formatTime={formatTime}
                  getProgressPercentage={getProgressPercentage}
                  toggleTimer={toggleTimer}
                  resetTimer={resetTimer}
                  isRunning={isRunning}
                  toggleFullScreen={toggleFullScreen}
                  currentSession={currentSession}
                />
              </TabsContent>
              <TabsContent value="short_break">
                <SessionContent
                  session="short_break"
                  timeRemaining={timeRemaining}
                  formatTime={formatTime}
                  getProgressPercentage={getProgressPercentage}
                  toggleTimer={toggleTimer}
                  resetTimer={resetTimer}
                  isRunning={isRunning}
                  toggleFullScreen={toggleFullScreen}
                  currentSession={currentSession}
                />
              </TabsContent>
              <TabsContent value="long_break">
                <SessionContent
                  session="long_break"
                  timeRemaining={timeRemaining}
                  formatTime={formatTime}
                  getProgressPercentage={getProgressPercentage}
                  toggleTimer={toggleTimer}
                  resetTimer={resetTimer}
                  isRunning={isRunning}
                  toggleFullScreen={toggleFullScreen}
                  currentSession={currentSession}
                />
              </TabsContent>
            </Tabs>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Enfócate en el momento presente</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface SessionContentProps {
  session: SessionType
  timeRemaining: number
  formatTime: (time: number) => string
  getProgressPercentage: () => number
  toggleTimer: () => void
  resetTimer: () => void
  isRunning: boolean
  toggleFullScreen: () => void
  currentSession: SessionType
}

const SessionContent: React.FC<SessionContentProps> = ({
  session,
  timeRemaining,
  formatTime,
  getProgressPercentage,
  toggleTimer,
  resetTimer,
  isRunning,
  toggleFullScreen,
  currentSession,
}) => {
  const getSessionBg = (session: SessionType) => {
    switch (session) {
      case "pomodoro":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      case "short_break":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "long_break":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
      default:
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
    }
  }

  const getSessionColor = (session: SessionType) => {
    switch (session) {
      case "pomodoro":
        return "text-red-600 dark:text-red-400"
      case "short_break":
        return "text-green-600 dark:text-green-400"
      case "long_break":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-red-600 dark:text-red-400"
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${getSessionBg(session)} border-2 rounded-lg p-6 space-y-4`}
    >
      <div className={`text-6xl font-bold ${getSessionColor(session)}`}>{formatTime(timeRemaining)}</div>
      <div className="space-y-2">
        <Progress
          value={getProgressPercentage()}
          className={`h-4 ${
            currentSession === "pomodoro"
              ? "[&>div]:bg-red-600 dark:[&>div]:bg-red-500"
              : currentSession === "short_break"
                ? "[&>div]:bg-green-600 dark:[&>div]:bg-green-500"
                : "[&>div]:bg-blue-600 dark:[&>div]:bg-blue-500"
          }`}
        />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {Math.round(getProgressPercentage())}% completado
        </div>
      </div>
      <div className="flex space-x-4">
        <Button variant="outline" size="icon" onClick={toggleTimer}>
          {isRunning ? <ArrowBigLeft className="w-6 h-6" /> : <ArrowBigRight className="w-6 h-6" />}
        </Button>
        <Button variant="outline" size="icon" onClick={resetTimer}>
          <Clock className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFullScreen}>
          <Maximize className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
