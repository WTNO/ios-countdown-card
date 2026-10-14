/** 日程类型定义 */
export interface Schedule {
  id: string
  title: string
  /** 目标时间戳（毫秒） */
  targetTime: number
  /** 颜色主题标识 */
  color: ScheduleColor
  /** 是否暂停 */
  paused: boolean
  /** 创建时间 */
  createdAt: number
  /** 备注（可选） */
  note?: string
}

export type ScheduleColor =
  | 'blue'
  | 'purple'
  | 'pink'
  | 'green'
  | 'orange'
  | 'red'
  | 'teal'
  | 'indigo'
  | 'mint'
  | 'yellow'
  | 'brown'
  | 'graphite'

export interface TimeParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isOverdue: boolean
}

export type ThemeMode = 'light' | 'dark'

/** 暴露给渲染进程的 Electron API 类型声明 */
declare global {
  interface Window {
    api: {
      window: {
        move: (dx: number, dy: number) => Promise<void>
        setPosition: (x: number, y: number) => Promise<void>
        show: () => Promise<void>
        hide: () => Promise<void>
        setAlwaysOnTop: (flag: boolean) => Promise<void>
        resize: (w: number, h: number) => Promise<void>
      }
      settings: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
      }
      app: {
        getVersion: () => Promise<string>
      }
    }
  }
}

export {}
