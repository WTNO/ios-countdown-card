import { app, BrowserWindow, Tray, Menu, ipcMain, screen } from 'electron'
import * as path from 'path'

// ==================== 常量 ====================
const WINDOW_WIDTH = 260
const WINDOW_HEIGHT = 240
const STORE_KEY_POS = 'window-position'
const STORE_KEY_THEME = 'app-theme'

// ==================== 全局引用 ====================
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

// ==================== 持久化存储（settings.json） ====================
import * as fs from 'fs'

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function readSettings(): Record<string, any> {
  try {
    const p = getStorePath()
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeSettings(data: Record<string, any>): void {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

// ==================== 创建主窗口 ====================
function createMainWindow(): void {
  const settings = readSettings()
  const display = screen.getPrimaryDisplay()
  const workArea = display.workArea

  // 读取上次位置，默认放在屏幕右下角
  let x: number, y: number
  if (settings[STORE_KEY_POS]) {
    x = settings[STORE_KEY_POS].x
    y = settings[STORE_KEY_POS].y
    // 确保窗口仍在屏幕可见范围内
    x = Math.max(0, Math.min(x, workArea.x + workArea.width - WINDOW_WIDTH))
    y = Math.max(0, Math.min(y, workArea.y + workArea.height - WINDOW_HEIGHT))
  } else {
    x = workArea.x + workArea.width - WINDOW_WIDTH - 40
    y = workArea.y + workArea.height - WINDOW_HEIGHT - 60
  }

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    frame: false,              // 无边框
    transparent: true,         // 背景透明
    alwaysOnTop: true,         // 置顶
    resizable: false,           // 不可调整大小
    skipTaskbar: true,          // 不在任务栏显示
    hasShadow: false,          // 我们自己控制阴影
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    useContentSize: true,      // width/height 指内容区域
    show: false,               // 等加载完再显示，避免白屏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 置顶级别 - normal 即可，不抢占其他窗口
  mainWindow.setAlwaysOnTop(true, 'normal')

  // 加载完成后用 showInactive 显示（不抢焦点）
  mainWindow.once('ready-to-show', () => {
    mainWindow?.showInactive()
  })

  // 加载页面
  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口移动结束时保存位置
  let saveTimer: NodeJS.Timeout | null = null
  mainWindow.on('move', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (!mainWindow) return
      const [wx, wy] = mainWindow.getPosition()
      const s = readSettings()
      s[STORE_KEY_POS] = { x: wx, y: wy }
      writeSettings(s)
    }, 300)
  })

  // 关闭时隐藏而不是退出（除非用户从托盘选退出）
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ==================== 创建系统托盘 ====================
function resolveIconPath(): string {
  // 开发环境：__dirname = dist-electron/，图标在 public/ 下
  const candidates = [
    path.join(__dirname, '../public/tray-icon.png'),
    path.join(__dirname, '../dist/tray-icon.png'),
    path.join(process.resourcesPath || '', 'public/tray-icon.png'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0] // fallback
}

function createTray(): void {
  const iconPath = resolveIconPath()

  tray = new Tray(iconPath)
  tray.setToolTip('iOS 倒计时卡片')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 / 隐藏卡片',
      click: () => toggleWindow(),
    },
    {
      label: '置顶',
      type: 'checkbox',
      checked: true,
      click: (item) => {
        mainWindow?.setAlwaysOnTop(item.checked, 'normal')
      },
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // 左键点击切换显示/隐藏
  tray.on('click', () => toggleWindow())
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.showInactive()
  }
}

// ==================== IPC 处理 ====================
ipcMain.handle('window:move', (_e, dx: number, dy: number) => {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  mainWindow.setPosition(x + dx, y + dy)
})

ipcMain.handle('window:setPosition', (_e, x: number, y: number) => {
  mainWindow?.setPosition(Math.round(x), Math.round(y))
})

ipcMain.handle('window:show', () => mainWindow?.showInactive())
ipcMain.handle('window:hide', () => mainWindow?.hide())
ipcMain.handle('window:setAlwaysOnTop', (_e, flag: boolean) => {
  mainWindow?.setAlwaysOnTop(flag, 'normal')
})
ipcMain.handle('window:resize', (_e, w: number, h: number) => {
  if (mainWindow) {
    const [oldX, oldY] = mainWindow.getPosition()
    const [oldW, oldH] = mainWindow.getSize()
    mainWindow.setResizable(true)
    mainWindow.setSize(Math.round(w), Math.round(h))
    mainWindow.setResizable(false)
    // 保持窗口中心点不变：中心点 = 左上 + 宽高/2
    const newX = oldX + Math.round((oldW - w) / 2)
    const newY = oldY + Math.round((oldH - h) / 2)
    mainWindow.setPosition(newX, newY)
  }
})

ipcMain.handle('settings:get', (_e, key: string) => {
  const s = readSettings()
  return s[key] ?? null
})

ipcMain.handle('settings:set', (_e, key: string, value: any) => {
  const s = readSettings()
  s[key] = value
  writeSettings(s)
})

ipcMain.handle('app:version', () => app.getVersion())

// ==================== App 生命周期 ====================
app.whenReady().then(() => {
  createMainWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不退出，保持托盘运行
  }
})

// 确保退出时清理
app.on('before-quit', () => {
  isQuitting = true
})
