/**
 * 开发环境启动脚本
 * 1. 启动 Vite 开发服务器
 * 2. 等服务器就绪后编译并启动 Electron
 */
const { spawn, spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
let viteProc = null
let electronProc = null

// ---------- 工具：查找 electron 可执行文件 ----------
function getElectronPath() {
  // 方式1: require('electron') 在 Node 下返回 electron.exe 的路径
  try {
    const p = require(path.join(projectRoot, 'node_modules', 'electron'))
    if (typeof p === 'string' && fs.existsSync(p)) return p
  } catch (_) { /* ignore */ }

  // 方式2: 常见路径
  const candidates = [
    path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe'),
    path.join(projectRoot, 'node_modules', '.bin', 'electron.cmd'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

// ---------- 启动 Vite ----------
console.log('[dev] 启动 Vite 开发服务器...')
viteProc = spawn('npx', ['vite'], {
  cwd: projectRoot,
  shell: true,
  stdio: 'inherit',
  env: { ...process.env },
})

viteProc.on('error', (err) => {
  console.error('[dev] Vite 启动失败:', err.message)
  cleanup()
  process.exit(1)
})

// ---------- 3 秒后编译并启动 Electron ----------
setTimeout(() => {
  // 1. 编译主进程
  console.log('[dev] 编译 Electron 主进程...')
  const tscResult = spawnSync('npx', ['tsc', '-p', 'electron/tsconfig.json'], {
    cwd: projectRoot,
    shell: true,
    stdio: 'inherit',
  })

  if (tscResult.status !== 0) {
    console.error('[dev] 主进程编译失败，退出')
    cleanup()
    process.exit(1)
  }

  // 2. 找到 electron 可执行文件
  const electronPath = getElectronPath()
  if (!electronPath) {
    console.error('[dev] 找不到 electron 可执行文件，请先运行 npm install')
    cleanup()
    process.exit(1)
  }
  console.log('[dev] Electron 路径:', electronPath)

  // 3. 启动 Electron
  console.log('[dev] 启动 Electron...')
  electronProc = spawn(electronPath, ['.'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env },
  })

  electronProc.on('error', (err) => {
    console.error('[dev] Electron 启动失败:', err.message)
    cleanup()
    process.exit(1)
  })

  electronProc.on('close', (code) => {
    console.log(`[dev] Electron 退出，代码 ${code}`)
    cleanup()
    process.exit(code ?? 0)
  })
}, 3000)

// ---------- 清理 ----------
function cleanup() {
  if (viteProc) { try { viteProc.kill() } catch (_) {} }
  if (electronProc) { try { electronProc.kill() } catch (_) {} }
}

process.on('SIGINT', () => { cleanup(); process.exit(0) })
process.on('SIGTERM', () => { cleanup(); process.exit(0) })
