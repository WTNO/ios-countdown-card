import { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

interface MenuItem {
  label: string
  action: () => void
  danger?: boolean
  divider?: boolean
  checked?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // 防止菜单超出屏幕
  const menuWidth = 160
  const menuHeight = items.length * 36 + 16
  const left = Math.min(x, window.innerWidth - menuWidth - 8)
  const top = Math.min(y, window.innerHeight - menuHeight - 8)

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className={styles.divider} />
        ) : (
          <button
            key={i}
            className={`${styles.item} ${item.danger ? styles.danger : ''}`}
            onClick={() => { item.action(); onClose() }}
          >
            {item.checked !== undefined && (
              <span className={styles.check}>{item.checked ? '✓' : ''}</span>
            )}
            <span>{item.label}</span>
          </button>
        ),
      )}
    </div>
  )
}
