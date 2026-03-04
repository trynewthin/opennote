/** 版本更新日志 */
export const CHANGELOG: { version: string; date: string; tag?: string; items: string[] }[] = [
    {
        version: "0.1.1",
        date: "2026-03-04",
        tag: "内测",
        items: [
            "新增 .on 格式项目导入/导出（后端驱动，原生文件对话框）",
            "新增设置对话框，支持侧边栏折叠",
            "设置关于页新增版本更新时间线",
            "内容卡片支持 Markdown 渲染",
            "内容卡片支持手动调整大小并持久化",
            "双击内容卡片触发编辑",
            "深色模式颜色统一为中性灰色调",
            "画布视口状态持久化到项目配置",
            "UI 图标统一使用 Lucide",
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
