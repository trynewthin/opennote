import { invoke } from "@tauri-apps/api/core";

type ConfigTarget = "project" | "nodeView" | "nodeSemantic" | "relationView" | "relationSemantic";

const COMMAND_MAP: Record<ConfigTarget, string> = {
    project: "update_project_config",
    nodeView: "update_node_view_config",
    nodeSemantic: "update_node_semantic_config",
    relationView: "update_relation_view_config",
    relationSemantic: "update_relation_semantic_config",
};

export const configService = {
    parse<T = Record<string, unknown>>(raw: string | null, fallback: T | null = null): T | null {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw) as T;
        } catch {
            console.warn("Failed to parse config JSON:", raw);
            return fallback;
        }
    },

    stringify(config: unknown): string | null {
        if (config == null) return null;
        return JSON.stringify(config);
    },

    async save(target: ConfigTarget, id: string, config: unknown): Promise<void> {
        const command = COMMAND_MAP[target];
        const value = config == null ? null : JSON.stringify(config);
        await invoke(command, { id, config: value });
    },

    merge<T extends Record<string, unknown>>(raw: string | null, patch: Partial<T>): T {
        const existing = (raw ? JSON.parse(raw) : {}) as T;
        return { ...existing, ...patch };
    },

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
