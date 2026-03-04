import { invoke } from "@tauri-apps/api/core";

type ConfigTarget = "project" | "node" | "link" | "content";

const COMMAND_MAP: Record<ConfigTarget, string> = {
    project: "update_project_config",
    node: "update_node_config",
    link: "update_link_config",
    content: "update_content_config",
};

/**
 * 实体 config JSON 的读写工具。
 *
 * config 是一个自由 JSON 字段，后端只做透传存储，
 * 前端负责序列化/反序列化和结构定义。
 *
 * 用法:
 *   const theme = configService.parse<NodeTheme>(node.config);
 *   await configService.save("node", node.id, { color: "#ff0", fontSize: 14 });
 *   const merged = configService.merge<NodeTheme>(node.config, { color: "#0ff" });
 */
export const configService = {
    /**
     * 解析实体的 config JSON 字符串为对象。
     * 如果为 null 或解析失败，返回 fallback（默认 null）。
     */
    parse<T = Record<string, unknown>>(raw: string | null, fallback: T | null = null): T | null {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw) as T;
        } catch {
            console.warn("Failed to parse config JSON:", raw);
            return fallback;
        }
    },

    /**
     * 将对象序列化为 JSON 字符串。
     * 传入 null/undefined 时返回 null（清空 config）。
     */
    stringify(config: unknown): string | null {
        if (config == null) return null;
        return JSON.stringify(config);
    },

    /**
     * 持久化 config 到后端。
     * 传入对象会自动 JSON.stringify，传入 null 则清空。
     */
    async save(target: ConfigTarget, id: string, config: unknown): Promise<void> {
        const command = COMMAND_MAP[target];
        const value = config == null ? null : JSON.stringify(config);
        await invoke(command, { id, config: value });
    },

    /**
     * 读取并合并：用新字段覆盖已有 config（浅合并）。
     * 返回合并后的完整对象。
     */
    merge<T extends Record<string, unknown>>(raw: string | null, patch: Partial<T>): T {
        const existing = (raw ? JSON.parse(raw) : {}) as T;
        return { ...existing, ...patch };
    },

    /**
     * 读取、合并、持久化一步到位。
     * 返回合并后的完整对象。
     */
    async patch<T extends Record<string, unknown>>(
        target: ConfigTarget,
        id: string,
        currentRaw: string | null,
        patch: Partial<T>,
    ): Promise<T> {
        const merged = this.merge<T>(currentRaw, patch);
        await this.save(target, id, merged);
        return merged;
    },
};
