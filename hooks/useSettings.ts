"use client"

import { useState } from "react"

export interface PomodoroSettings {
  sound_enabled: boolean
  notifications_enabled: boolean
  auto_start_breaks: boolean
  auto_start_pomodoros: boolean
}

const defaultSettings: PomodoroSettings = {
  sound_enabled: true,
  notifications_enabled: true,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings)

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }))
  }

  return { settings, updateSettings }
}
