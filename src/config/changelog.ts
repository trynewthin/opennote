/** 版本更新日志 */
export const CHANGELOG: { version: string; date: string; tag?: string; items: string[] }[] = [
    {
        version: "0.1.1",
        date: "2026-03-04",
        tag: "首个内测发布",
        items: [
            "🎉 **OpenNote 首个内测版本正式发布**！",
            "✨ 核心功能：无限延伸的知识图谱画布、自由摆放的内容卡片以及流畅的 Markdown 笔记体验",
            "🚀 新增内测专用功能：一键检查更新，获取后续版本推送",
            "📦 支持导出为跨平台通用的 `.on` 项目归档，方便备份和分享",
            "⚙️ 新增全新设置面板，支持在应用内快速配置个性化选项",
            "🎨 启用了全新的科技极简风 Möbius UI 莫比乌斯环图标设计",
        ],
    },
    {
        version: "0.1.0",
        date: "2026-03-03",
        tag: "内测",
        items: [
            "知识图谱画布：节点、内容、连线",
            "节点拖拽、缩放、平移",
            "右键菜单：增删改节点和内容",
            "内容卡片轨道布局与碰撞检测",
            "深色 / 浅色模式切换",
            "项目管理基础功能",
        ],
    },
];

/** 当前版本号 */
export const APP_VERSION = CHANGELOG[0].version;

/** 当前版本标签 */
export const APP_VERSION_TAG = CHANGELOG[0].tag;
