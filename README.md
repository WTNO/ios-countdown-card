# iOS 风格日程倒计时悬浮卡片

一个运行在 Windows 桌面上的 iOS 风格倒计时悬浮卡片应用，基于 Electron + React + Vite + TypeScript 构建。

## 项目结构



```
ios-countdown-card/
├── package.json              # 项目依赖与脚本
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # 渲染进程 TS 配置
├── tsconfig.node.json        # Vite 配置文件 TS 配置
├── index.html                # 入口 HTML
│
├── electron/                 # Electron 主进程
│   ├── main.ts               # 主进程：窗口、托盘、IPC、开机自启
│   ├── preload.ts            # 预加载脚本：安全暴露 IPC API
│   └── tsconfig.json         # 主进程 TS 配置
│
├── scripts/
│   └── dev.cjs               # 开发环境启动脚本
│
├── public/                   # 静态资源（图标等）
│
└── src/                      # React 渲染进程
    ├── main.tsx              # React 入口
    ├── App.tsx               # 主应用组件
    ├── App.module.css        # 主应用样式
    ├── index.css             # 全局样式 + 主题变量
    │
    ├── types/
    │   └── index.ts          # 类型定义（Schedule、Theme 等）
    │
    ├── utils/
    │   └── date.ts           # 时间计算工具函数
    │
    ├── hooks/
    │   ├── useCountdown.ts   # 倒计时 Hook（每秒刷新）
    │   └── useSchedules.ts   # 日程数据管理 + localStorage 持久化
    │
    └── components/
        ├── CountdownCard.tsx           # 单张倒计时卡片
        ├── CountdownCard.module.css     # 卡片样式
        ├── AddEditModal.tsx            # 添加/编辑日程弹窗
        ├── AddEditModal.module.css     # 弹窗样式
        ├── ContextMenu.tsx            # 右键菜单
        └── ContextMenu.module.css      # 菜单样式
```

## 快速开始

### 环境要求



* Node.js >= 18

* Windows 10/11

### 安装依赖



```
cd ios-countdown-card
npm install
```

### 开发模式运行



```
npm run electron:dev
```

这会同时启动 Vite 开发服务器（端口 5173）和 Electron 窗口。

### 打包为 Windows EXE



```
npm run electron:build
```

打包产物会输出到 `release/` 目录，包含 NSIS 安装程序。

## 功能清单



| 功能           | 说明                         |
| ------------ | -------------------------- |
| 桌面悬浮卡片       | 无边框、透明背景、始终置顶、不抢占焦点        |
| 多日程倒计时       | 支持添加任意数量日程，显示天 / 时 / 分 / 秒 |
| 实时刷新         | 每秒更新一次，基于绝对时间戳计算           |
| 添加 / 编辑 / 删除 | 双击卡片或右键菜单操作                |
| 暂停 / 继续      | 每个日程可独立暂停倒计时               |
| 数据持久化        | localStorage 自动保存，重启不丢失    |
| 系统托盘         | 点击托盘图标显示 / 隐藏卡片            |
| 开机自启         | 托盘菜单中可开关                   |
| 窗口拖拽         | 按住卡片拖动到任意位置，位置自动记忆         |
| 浅色 / 深色模式    | 右键菜单切换                     |
| 右键菜单         | 添加日程、置顶、主题、隐藏、退出           |
| 毛玻璃效果        | iOS 风格半透明模糊背景              |

## 使用说明



* **拖动卡片**：按住卡片空白处拖拽即可移动位置

* **添加日程**：双击空白处 / 双击卡片底部「+ 添加日程」/ 右键菜单选「添加日程」

* **编辑日程**：双击某张卡片 / 鼠标悬停后点 ✎ 按钮

* **暂停 / 继续**：鼠标悬停卡片后点 ⏸ 或 ▶

* **删除日程**：鼠标悬停卡片后点 ✕

* **右键菜单**：在卡片区域右键打开菜单

* **隐藏到托盘**：右键菜单选「隐藏卡片」，或点托盘图标

* **显示卡片**：点击托盘图标即可重新显示

## 技术要点



1. **无边框透明窗口**：`frame: false` + `transparent: true`，只渲染卡片区域

2. **不抢占焦点**：`setFocusable(false)`，点击不抢其他窗口输入

3. **置顶不抢层**：`setAlwaysOnTop(true, 'normal')`，不会覆盖全屏应用

4. **倒计时精度**：使用 `Date.now()` 与目标时间戳的差值计算，避免 setInterval 累计误差

5. **窗口拖拽**：通过 IPC 调用主进程 `setPosition` 实现跨进程移动

6. **位置记忆**：窗口移动结束后自动写入 `settings.json`

7. **数据存储**：渲染进程使用 localStorage，主进程使用 userData 下的 settings.json