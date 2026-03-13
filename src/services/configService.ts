export const configService = {
    parse<T>(raw: T | null | undefined, fallback: T | null = null): T | null {
        return raw ?? fallback;
    },

    merge<T extends Record<string, unknown>>(raw: T | null | undefined, patch: Partial<T>): T {
        return { ...(raw ?? {}), ...patch } as T;
    },
};
