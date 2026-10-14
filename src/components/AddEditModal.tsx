import { useState, useEffect } from 'react'
import type { Schedule, ScheduleColor } from '@/types'
import { toLocalInputValue, fromLocalInputValue } from '@/utils/date'
import styles from './AddEditModal.module.css'

interface Props {
  /** null 表示新增，传入 Schedule 表示编辑 */
  initial: Schedule | null
  onClose: () => void
  onSubmit: (data: Omit<Schedule, 'id' | 'createdAt'>) => void
}

const COLORS: { value: ScheduleColor; label: string; dot: string }[] = [
  { value: 'blue',     label: '蓝',   dot: '#007AFF' },
  { value: 'purple',   label: '紫',   dot: '#AF52DE' },
  { value: 'pink',     label: '粉',   dot: '#FF375F' },
  { value: 'green',    label: '绿',   dot: '#34C759' },
  { value: 'orange',  label: '橙',   dot: '#FF9500' },
  { value: 'red',     label: '红',   dot: '#FF3B30' },
  { value: 'teal',    label: '青',   dot: '#30B0C7' },
  { value: 'indigo',   label: '靛',   dot: '#5856D6' },
  { value: 'mint',     label: '薄荷', dot: '#00C7BE' },
  { value: 'yellow',    label: '黄',   dot: '#FFCC00' },
  { value: 'brown',   label: '棕',   dot: '#A2845E' },
  { value: 'graphite', label: '灰',   dot: '#636366' },
]

export function AddEditModal({ initial, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [targetTime, setTargetTime] = useState(
    initial ? toLocalInputValue(new Date(initial.targetTime)) : toLocalInputValue(new Date(Date.now() + 86400000)),
  )
  const [color, setColor] = useState<ScheduleColor>(initial?.color ?? 'blue')
  const [note, setNote] = useState(initial?.note ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      targetTime: fromLocalInputValue(targetTime),
      color,
      paused: initial?.paused ?? false,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{initial ? '编辑日程' : '添加日程'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>标题</label>
            <input
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：新年、考试、项目截止"
              autoFocus
              maxLength={30}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>目标时间</label>
            <input
              className={styles.input}
              type="datetime-local"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>颜色</label>
            <div className={styles.colorRow}>
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.colorDot} ${color === c.value ? styles.colorDotActive : ''}`}
                  style={{ background: c.dot }}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>备注（可选）</label>
            <input
              className={styles.input}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注..."
              maxLength={50}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!title.trim()}>
              {initial ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
