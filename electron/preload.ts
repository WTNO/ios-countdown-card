import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload 脚本：在渲染进程暴露安全的 IPC API
 * 渲染进程通过 window.api.xxx 调用
 */
const api = {
  // 窗口控制
  window: {
    move: (dx: number, dy: number) => ipcRenderer.invoke('window:move', dx, dy),
    setPosition: (x: number, y: number) => ipcRenderer.invoke('window:setPosition', x, y),
    show: () => ipcRenderer.invoke('window:show'),
    hide: () => ipcRenderer.invoke('window:hide'),
    setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
    resize: (w: number, h: number) => ipcRenderer.invoke('window:resize', w, h),
  },
  // 设置读写
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  },
  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
  },
  // 主题变化（预留）
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme:changed', (_e, theme) => callback(theme))
  },
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
