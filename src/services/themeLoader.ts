import type { CSSProperties } from "react";
import type { JsonObject } from "@/types";
import {
    defaultNodeTheme,
    defaultContentTheme,
    defaultLinkTheme,
    defaultContentLinkTheme,
} from "@/config/defaultTheme";

export interface NodeTheme {
    color?: string;
    colorDark?: string;
    bgColor?: string;
    bgColorDark?: string;
    borderColor?: string;
    borderColorDark?: string;
    fontSize?: number;
    fontWeight?: string | number;
    opacity?: number;
    [key: string]: unknown;
}

export interface ContentTheme {
    color?: string;
    colorDark?: string;
    bgColor?: string;
    bgColorDark?: string;
    borderColor?: string;
    borderColorDark?: string;
    fontSize?: number;
    minWidth?: number;
    opacity?: number;
    [key: string]: unknown;
}

export interface LinkTheme {
    color?: string;
    colorDark?: string;
    width?: number;
    dashArray?: string;
    opacity?: number;
    [key: string]: unknown;
}

export interface ContentLinkTheme {
    color?: string;
    colorDark?: string;
    width?: number;
    curvature?: number;
    [key: string]: unknown;
}

export interface ProjectTheme {
    node?: Partial<NodeTheme>;
    content?: Partial<ContentTheme>;
    link?: Partial<LinkTheme>;
    contentLink?: Partial<ContentLinkTheme>;
    [key: string]: unknown;
}

function parseConfig<T>(raw: JsonObject | null | undefined): Partial<T> {
    return (raw ?? {}) as Partial<T>;
}

function merge<T extends Record<string, unknown>>(...layers: Partial<T>[]): T {
    const result = {} as Record<string, unknown>;
    for (const layer of layers) {
        for (const key of Object.keys(layer)) {
            if (layer[key] !== undefined) {
                result[key] = layer[key];
            }
        }
    }
    return result as T;
}

export const themeLoader = {
    node(
        isDark: boolean,
        entityConfig?: JsonObject | null,
        projectConfig?: JsonObject | null,
        typeOverrides?: Partial<NodeTheme>,
    ): { theme: NodeTheme; css: CSSProperties; textCss: CSSProperties } {
        const projectTheme = parseConfig<ProjectTheme>(projectConfig);
        const entityTheme = parseConfig<NodeTheme>(entityConfig);
        const theme = merge<NodeTheme>(defaultNodeTheme, projectTheme.node ?? {}, typeOverrides ?? {}, entityTheme);

        return {
            theme,
            css: {
                backgroundColor: isDark ? (theme.bgColorDark ?? defaultNodeTheme.bgColorDark) : (theme.bgColor ?? defaultNodeTheme.bgColor),
                borderColor: isDark ? (theme.borderColorDark ?? defaultNodeTheme.borderColorDark) : (theme.borderColor ?? defaultNodeTheme.borderColor),
                opacity: theme.opacity,
            },
            textCss: {
                color: isDark ? (theme.colorDark ?? defaultNodeTheme.colorDark) : (theme.color ?? defaultNodeTheme.color),
                fontSize: theme.fontSize ?? defaultNodeTheme.fontSize,
                fontWeight: theme.fontWeight as CSSProperties["fontWeight"],
            },
        };
    },

    content(isDark: boolean, entityConfig?: JsonObject | null, projectConfig?: JsonObject | null): { theme: ContentTheme; css: CSSProperties; textCss: CSSProperties } {
        const projectTheme = parseConfig<ProjectTheme>(projectConfig);
        const entityTheme = parseConfig<ContentTheme>(entityConfig);
        const theme = merge<ContentTheme>(defaultContentTheme, projectTheme.content ?? {}, entityTheme);

        return {
            theme,
            css: {
                backgroundColor: isDark ? theme.bgColorDark : theme.bgColor,
                borderColor: isDark ? theme.borderColorDark : theme.borderColor,
                minWidth: theme.minWidth,
                opacity: theme.opacity,
            },
            textCss: {
                color: isDark ? theme.colorDark : theme.color,
                fontSize: theme.fontSize,
            },
        };
    },

    link(isDark: boolean, entityConfig?: JsonObject | null, projectConfig?: JsonObject | null): { theme: LinkTheme; stroke: string; strokeWidth: number; strokeDasharray: string } {
        const projectTheme = parseConfig<ProjectTheme>(projectConfig);
        const entityTheme = parseConfig<LinkTheme>(entityConfig);
        const theme = merge<LinkTheme>(defaultLinkTheme, projectTheme.link ?? {}, entityTheme);

        return {
            theme,
            stroke: isDark ? (theme.colorDark ?? defaultLinkTheme.colorDark) : (theme.color ?? defaultLinkTheme.color),
            strokeWidth: theme.width ?? defaultLinkTheme.width,
            strokeDasharray: theme.dashArray ?? "",
        };
    },

    contentLink(isDark: boolean, entityConfig?: JsonObject | null, projectConfig?: JsonObject | null): { stroke: string; strokeWidth: number; curvature: number } {
        const projectTheme = parseConfig<ProjectTheme>(projectConfig);
        const entityTheme = parseConfig<ContentLinkTheme>(entityConfig);
        const theme = merge<ContentLinkTheme>(defaultContentLinkTheme, projectTheme.contentLink ?? {}, entityTheme);

        return {
            stroke: isDark ? (theme.colorDark ?? defaultContentLinkTheme.colorDark) : (theme.color ?? defaultContentLinkTheme.color),
            strokeWidth: theme.width ?? defaultContentLinkTheme.width,
            curvature: theme.curvature ?? defaultContentLinkTheme.curvature,
        };
    },

    project(projectConfig: JsonObject | null | undefined): ProjectTheme {
        return parseConfig<ProjectTheme>(projectConfig);
    },
};
