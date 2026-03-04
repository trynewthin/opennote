# OpenNote

一个基于知识图谱的本地笔记应用，让你的笔记像星系一样互相连接。

## 特性

- 🧠 **知识图谱** — 以节点和关系可视化组织笔记，直观展示知识网络
- 📝 **Markdown 编辑** — 内置 Markdown 支持，轻量高效的内容编辑体验
- 🎨 **主题系统** — 支持亮色/暗色模式，可自定义节点样式与配色
- 💾 **本地优先** — 数据存储在本地 SQLite，隐私安全，无需联网
- 🔄 **自动更新** — 支持通过 GitHub Releases 自动检测和安装更新
- 🖥️ **跨平台** — 基于 Tauri 构建，支持 Windows / macOS / Linux

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| UI 组件 | shadcn/ui + Tailwind CSS v4 |
| 图谱渲染 | HTML/DOM 节点定位 + SVG 关系层 |
| 状态管理 | Zustand |
| 桌面框架 | Tauri 2 |
| 后端逻辑 | Rust |
| 数据存储 | SQLite |
| 构建工具 | Vite 7 + Bun |

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.0
- [Rust](https://rustup.rs/) >= 1.77
- Tauri 2 系统依赖（参阅 [Tauri 官方文档](https://v2.tauri.app/start/prerequisites/)）

### 开发

```bash
# 安装依赖
bun install

# 启动开发模式
bun run tauri dev
```

### 构建

```bash
bun run tauri build
```

## 添加 UI 组件

```bash
bunx --bun shadcn@latest add [component-name]
```

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可证。

你可以自由地共享和改编本项目，但**不得用于商业目的**。详见 [LICENSE](./LICENSE) 文件。