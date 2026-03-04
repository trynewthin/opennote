import { invoke } from "@tauri-apps/api/core";
import type { Link } from "@/types";

// ─── Link API ───

export async function createLink(
    projectId: string,
    sourceId: string,
    targetId: string,
    label: string | null,
    direction: string,
    linkType: string,
    weight: number,
    sortOrder: number
): Promise<Link> {
    return invoke<Link>("create_link", {
        projectId,
        sourceId,
        targetId,
        label,
        direction,
        linkType,
        weight,
        sortOrder,
    });
}

export async function updateLink(
    id: string,
    label: string | null,
    direction: string,
    linkType: string,
    weight: number,
    sortOrder: number
): Promise<Link> {
    return invoke<Link>("update_link", {
        id,
        label,
        direction,
        linkType,
        weight,
        sortOrder,
    });
}

export async function deleteLink(id: string): Promise<void> {
    return invoke<void>("delete_link", { id });
}
