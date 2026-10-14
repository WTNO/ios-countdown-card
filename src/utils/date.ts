import type { TimeParts } from '@/types'

/**
 * 计算距离目标时间的剩余时间
 * 使用绝对时间戳计算，避免累计误差
 */
export function getTimeParts(targetTime: number, now: number = Date.now()): TimeParts {
  const diff = targetTime - now
  const absDiff = Math.abs(diff)
  const isOverdue = diff <= 0

  const totalSeconds = Math.floor(absDiff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, totalMs: diff, isOverdue }
}

/** 生成唯一 ID */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 格式化时间显示 - 补零 */
export function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/** 从 Date 对象取本地时间输入值 */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 从 input datetime-local 值转时间戳 */
export function fromLocalInputValue(v: string): number {
  return new Date(v).getTime()
}

/** 友好显示剩余天数 */
export function formatDaysLabel(days: number): string {
  if (days === 0) return '今天'
  if (days === 1) return '1 天'
  return `${days} 天`
}
