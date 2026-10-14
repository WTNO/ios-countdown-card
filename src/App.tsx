import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { Schedule } from '@/types'
import { useSchedules } from '@/hooks/useSchedules'
import { CountdownCard } from '@/components/CountdownCard'
import { AddEditModal } from '@/components/AddEditModal'
import { ContextMenu } from '@/components/ContextMenu'
import styles from './App.module.css'

interface ContextMenuState {
  x: number
  y: number
}

export default function App() {
  const {
    schedules,
    theme,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    togglePause,
    toggleTheme,
  } = useSchedules()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 按目标时间从近到远排序
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => a.targetTime - b.targetTime)
  }, [schedules])

  // 弹窗打开时放大窗口，关闭时缩回
  useEffect(() => {
    if (modalOpen) {
      window.api?.window.resize(300, 440)
    } else {
      window.api?.window.resize(260, 240)
    }
  }, [modalOpen])

  // ---- 滑动手势 ----
  const dragState = useRef<{
    startX: number
    startY: number
    dragging: boolean
  } | null>(null)
  const [dragX, setDragX] = useState(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, a')) return
    dragState.current = { startX: e.clientX, startY: e.clientY, dragging: true }
    setDragX(0)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current?.dragging) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    // 只在水平方向滑动明显时才跟随
    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      setDragX(dx)
    }
  }, [])

  const onMouseUp = useCallback(() => {
    if (!dragState.current?.dragging) return
    dragState.current.dragging = false

    const threshold = 80
    if (dragX < -threshold && currentIndex < sortedSchedules.length - 1) {
      // 左滑 → 下一张
      setCurrentIndex(prev => prev + 1)
    } else if (dragX > threshold && currentIndex > 0) {
      // 右滑 → 上一张
      setCurrentIndex(prev => prev - 1)
    }
    setDragX(0)
  }, [dragX, currentIndex, sortedSchedules.length])

  // ---- 右键菜单 ----
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // ---- 事件处理 ----
  const handleAdd = useCallback(() => {
    setEditing(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((s: Schedule) => {
    setEditing(s)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteSchedule(id)
    // 删除后如果当前索引越界，回退
    if (currentIndex >= sortedSchedules.length - 1) {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }
  }, [deleteSchedule, currentIndex, sortedSchedules.length])

  const handleSubmit = useCallback((data: Omit<Schedule, 'id' | 'createdAt'>) => {
    if (editing) {
      updateSchedule(editing.id, data)
    } else {
      addSchedule(data)
    }
  }, [editing, addSchedule, updateSchedule])

  const toggleAlwaysOnTop = useCallback(() => {
    setAlwaysOnTop(prev => {
      const next = !prev
      window.api?.window.setAlwaysOnTop(next)
      return next
    })
  }, [])

  const handleHide = useCallback(() => {
    window.api?.window.hide()
  }, [])

  // 计算每张卡片的堆叠样式
  const getCardStyle = (index: number): React.CSSProperties => {
    const offset = index - currentIndex
    if (offset < 0) {
      // 当前卡片上方的（已经滑过的）- 隐藏
      return {
        transform: `translateX(${offset * 300}px) scale(0.9)`,
        opacity: 0,
        zIndex: 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: 'none',
      }
    }
    if (offset === 0) {
      // 当前卡片 - 跟随手指拖动
      return {
        transform: `translateX(${dragX}px) scale(1) rotate(${dragX * 0.02}deg)`,
        opacity: 1,
        zIndex: 10,
        transition: dragState.current?.dragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      }
    }
    if (offset === 1) {
      // 下一张 - 在后面微微露出
      return {
        transform: `translateY(12px) scale(0.95)`,
        opacity: 0.6,
        zIndex: 5,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: 'none',
      }
    }
    if (offset === 2) {
      // 第三张 - 露出更少
      return {
        transform: `translateY(24px) scale(0.9)`,
        opacity: 0.3,
        zIndex: 3,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: 'none',
      }
    }
    // 更多的卡片 - 隐藏
    return {
      transform: `translateY(36px) scale(0.85)`,
      opacity: 0,
      zIndex: 1,
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      pointerEvents: 'none',
    }
  }

  return (
    <div
      className={styles.container}
      onContextMenu={onContextMenu}
      data-theme={theme}
    >
      {/* 卡牌堆叠区域 */}
      <div
        className={styles.stackArea}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {sortedSchedules.length === 0 ? (
          <div className={styles.empty} onDoubleClick={handleAdd}>
            <div className={styles.emptyIcon}>＋</div>
            <p>点击下方添加日程</p>
          </div>
        ) : (
          sortedSchedules.map((s, i) => (
            <div key={s.id} className={styles.cardWrapper} style={getCardStyle(i)}>
              <CountdownCard
                schedule={s}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePause={togglePause}
              />
            </div>
          ))
        )}
      </div>

      {/* 分页指示点 */}
      {sortedSchedules.length > 1 && (
        <div className={styles.dots}>
          {sortedSchedules.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}

      {/* 添加按钮 */}
      <div className={styles.hint} onClick={handleAdd}>
        ＋ 添加日程
      </div>

      {/* 添加/编辑弹窗 */}
      {modalOpen && (
        <AddEditModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* 右键菜单 */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: '添加日程', action: handleAdd },
            { label: alwaysOnTop ? '取消置顶' : '置顶', action: toggleAlwaysOnTop, checked: alwaysOnTop },
            { label: theme === 'light' ? '切换深色模式' : '切换浅色模式', action: toggleTheme },
            { divider: true, label: '', action: () => {} },
            { label: '隐藏卡片', action: handleHide },
            { divider: true, label: '', action: () => {} },
            { label: '退出', action: () => window.close(), danger: true },
          ]}
        />
      )}
    </div>
  )
}
