import type { NodeTheme, ContentTheme, LinkTheme, ContentLinkTheme } from "@/services/themeLoader";

/**
 * 默认主题配置
 *
 * 所有渲染实体的视觉基准值都在这里维护。
 * 修改此文件即可全局调整外观，无需动任何组件代码。
 */

/** 节点默认主题 */
export const defaultNodeTheme: Required<NodeTheme> = {
    color: "#1f2937",           // text-gray-800
    colorDark: "#f4f4f5",       // text-zinc-100
    bgColor: "#fafafa",          // zinc-50
    bgColorDark: "#27272a",     // zinc-800
    borderColor: "#d4d4d8",     // zinc-300
    borderColorDark: "#52525b", // zinc-600
    fontSize: 14,
    fontWeight: 600,
    opacity: 1,
};

/** 内容卡片默认主题 */
export const defaultContentTheme: Required<ContentTheme> = {
    color: "#374151",           // gray-700
    colorDark: "#e4e4e7",       // zinc-200
    bgColor: "#f4f4f5",         // zinc-100
    bgColorDark: "#3f3f46",     // zinc-700
    borderColor: "#d4d4d8",     // zinc-300
    borderColorDark: "#52525b", // zinc-600
    fontSize: 12,
    minWidth: 70,
    opacity: 1,
};

/** 节点间连线默认主题 */
export const defaultLinkTheme: Required<LinkTheme> = {
    color: "rgba(156,163,175,0.4)",     // gray-400
    colorDark: "rgba(156,163,175,0.35)",
    width: 1.5,
    dashArray: "",
    opacity: 1,
};

/** 节点→内容连接线默认主题 */
export const defaultContentLinkTheme: Required<ContentLinkTheme> = {
    color: "rgba(156,163,175,0.45)",    // gray-400
    colorDark: "rgba(156,163,175,0.4)",
    width: 1.5,
    curvature: 20,
};
