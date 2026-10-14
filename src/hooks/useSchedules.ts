import { useState, useEffect, useCallback } from 'react'
import type { Schedule, ThemeMode } from '@/types'
import { genId } from '@/utils/date'

const STORAGE_KEY = 'ios-countdown-schedules'
const THEME_KEY = 'ios-countdown-theme'

/** 示例日程数据 */
const SAMPLE_SCHEDULES: Schedule[] = [
  {
    id: genId(),
    title: '新年',
    targetTime: new Date(new Date().getFullYear() + 1, 0, 1, 0, 0).getTime(),
    color: 'red',
    paused: false,
    createdAt: Date.now(),
    note: '迎接新的一年',
  },
  {
    id: genId(),
    title: '项目截止日',
    targetTime: Date.now() + 1000 * 60 * 60 * 24 * 15 + 1000 * 60 * 60 * 8,
    color: 'blue',
    paused: false,
    createdAt: Date.now(),
  },
  {
    id: genId(),
    title: '朋友婚礼',
    targetTime: Date.now() + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 5,
    color: 'pink',
    paused: false,
    createdAt: Date.now(),
  },
]

function loadSchedules(): Schedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Schedule[]
    }
  } catch {
    /* ignore */
  }
  // 首次使用返回示例数据
  return SAMPLE_SCHEDULES
}

function loadTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch { /* ignore */ }
  return 'light'
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>(loadSchedules)
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme)

  // 持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  }, [schedules])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const addSchedule = useCallback((data: Omit<Schedule, 'id' | 'createdAt'>) => {
    setSchedules(prev => [...prev, { ...data, id: genId(), createdAt: Date.now() }])
  }, [])

  const updateSchedule = useCallback((id: string, patch: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
  }, [])

  const togglePause = useCallback((id: string) => {
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, paused: !s.paused } : s)))
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return {
    schedules,
    theme,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    togglePause,
    toggleTheme,
  }
}
