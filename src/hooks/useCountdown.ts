import { useEffect, useState, useCallback, useRef } from 'react'
import { getTimeParts } from '@/utils/date'
import type { TimeParts } from '@/types'

/**
 * 倒计时 Hook - 每秒刷新一次
 * 使用 setInterval + Date.now() 绝对时间戳计算
 */
export function useCountdown(targetTime: number, paused: boolean): TimeParts {
  const [now, setNow] = useState(() => Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    if (paused) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    // 每秒刷新
    timerRef.current = setInterval(tick, 1000)
    // 立即计算一次
    tick()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [paused, tick])

  // 当目标时间变化时立即重算
  useEffect(() => {
    setNow(Date.now())
  }, [targetTime])

  return getTimeParts(targetTime, now)
}
