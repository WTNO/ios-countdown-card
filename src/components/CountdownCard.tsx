import { memo } from 'react'
import type { Schedule } from '@/types'
import { useCountdown } from '@/hooks/useCountdown'
import { pad } from '@/utils/date'
import styles from './CountdownCard.module.css'

interface Props {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onTogglePause: (id: string) => void
}

/** 颜色配置 - iOS 风格渐变 */
const COLOR_MAP: Record<Schedule['color'], { from: string; to: string; glow: string }> = {
  blue:    { from: '#5AC8FA', to: '#007AFF', glow: 'rgba(0,122,255,0.25)' },
  purple:  { from: '#BF5AF2', to: '#AF52DE', glow: 'rgba(175,82,222,0.25)' },
  pink:    { from: '#FF2D55', to: '#FF375F', glow: 'rgba(255,45,85,0.25)' },
  green:   { from: '#34C759', to: '#30D158', glow: 'rgba(52,199,89,0.25)' },
  orange:  { from: '#FF9500', to: '#FF6B00', glow: 'rgba(255,149,0,0.25)' },
  red:     { from: '#FF3B30', to: '#FF453A', glow: 'rgba(255,59,48,0.25)' },
  teal:    { from: '#64D2FF', to: '#30B0C7', glow: 'rgba(48,176,199,0.25)' },
  indigo:  { from: '#7D7AFF', to: '#5856D6', glow: 'rgba(88,86,214,0.25)' },
  mint:    { from: '#5DE5C1', to: '#00C7BE', glow: 'rgba(0,199,190,0.25)' },
  yellow:  { from: '#FFD60A', to: '#FFCC00', glow: 'rgba(255,204,0,0.25)' },
  brown:   { from: '#D2B48C', to: '#A2845E', glow: 'rgba(162,132,94,0.25)' },
  graphite:{ from: '#8E8E93', to: '#636366', glow: 'rgba(99,99,102,0.25)' },
}

export const CountdownCard = memo(function CountdownCard({
  schedule,
  onEdit,
  onDelete,
  onTogglePause,
}: Props) {
  const t = useCountdown(schedule.targetTime, schedule.paused)
  const c = COLOR_MAP[schedule.color]

  return (
    <div
      className={styles.card}
      style={{
        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
        boxShadow: `0 8px 24px ${c.glow}, 0 2px 8px rgba(0,0,0,0.08)`,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEdit(schedule)
      }}
    >
      {/* 悬浮操作按钮 */}
      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          title={schedule.paused ? '继续' : '暂停'}
          onClick={(e) => { e.stopPropagation(); onTogglePause(schedule.id) }}
        >
          {schedule.paused ? '▶' : '⏸'}
        </button>
        <button
          className={styles.actionBtn}
          title="编辑"
          onClick={(e) => { e.stopPropagation(); onEdit(schedule) }}
        >
          ✎
        </button>
        <button
          className={styles.actionBtn}
          title="删除"
          onClick={(e) => { e.stopPropagation(); onDelete(schedule.id) }}
        >
          ✕
        </button>
      </div>

      {/* 标题 */}
      <div className={styles.title}>{schedule.title}</div>

      {/* 大数字 - 天数 */}
      <div className={styles.daysRow}>
        <span className={styles.daysNum}>{pad(t.days, 2)}</span>
        <span className={styles.daysUnit}>天</span>
      </div>

      {/* 时分秒 */}
      <div className={styles.timeRow}>
        <TimeBlock value={pad(t.hours)} label="时" />
        <Colon />
        <TimeBlock value={pad(t.minutes)} label="分" />
        <Colon />
        <TimeBlock value={pad(t.seconds)} label="秒" />
      </div>

      {/* 状态标签 */}
      {schedule.paused && <div className={styles.badgePaused}>已暂停</div>}
      {t.isOverdue && !schedule.paused && <div className={styles.badgeDone}>已到期</div>}

      {/* 备注 */}
      {schedule.note && <div className={styles.note}>{schedule.note}</div>}
    </div>
  )
})

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.timeBlock}>
      <span className={styles.timeNum}>{value}</span>
      <span className={styles.timeLabel}>{label}</span>
    </div>
  )
}

function Colon() {
  return <span className={styles.colon}>:</span>
}
