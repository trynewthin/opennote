import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGraphStore } from "@/stores/graphStore";
import { configService } from "@/services/configService";
import { resolveMenuItems } from "@/lib/contextMenuRegistry";
import { executeMenuAction } from "@/lib/contextMenuActions";
import type { MenuContext, MenuZone } from "@/lib/contextMenuRegistry";
import type { RelationSemanticConfig } from "@/types";

export function GraphContextMenus() {
    const { t } = useTranslation();
    const { contextMenu, closeContextMenu, nodes, relations } = useGraphStore();

    useEffect(() => {
        if (!contextMenu.show) return;

        const handleClose = () => closeContextMenu();
        const handleContextMenu = (event: MouseEvent) => {
            const menu = document.querySelector(".graph-context-menu");
            if (menu && !menu.contains(event.target as HTMLElement)) {
                closeContextMenu();
            }
        };

        document.addEventListener("mousedown", handleClose);
        document.addEventListener("contextmenu", handleContextMenu, true);
        window.addEventListener("scroll", handleClose, true);

        return () => {
            document.removeEventListener("mousedown", handleClose);
            document.removeEventListener("contextmenu", handleContextMenu, true);
            window.removeEventListener("scroll", handleClose, true);
        };
    }, [contextMenu.show, closeContextMenu]);

    if (!contextMenu.show) return null;

    const node = contextMenu.type === "node" && contextMenu.targetId
        ? nodes.find((item) => item.id === contextMenu.targetId)
        : undefined;
    const relation = contextMenu.type === "relation" && contextMenu.targetId
        ? relations.find((item) => item.id === contextMenu.targetId)
        : undefined;

    const context: MenuContext = {
        target: contextMenu.type,
        zone: (contextMenu.zone ?? "background") as MenuZone,
        targetId: contextMenu.targetId,
        node,
        relation,
        worldX: contextMenu.worldX,
        worldY: contextMenu.worldY,
    };

    const items = resolveMenuItems(context);
    const currentDirection = relation
        ? configService.parse<RelationSemanticConfig>(relation.semantic_config, {})?.direction ?? "none"
        : null;

    return (
        <div
            style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, zIndex: 50 }}
            onMouseDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <div className="graph-context-menu">
                {items.map((item, index) => {
                    const isDirectionItem = item.action.startsWith("setRelationDirection.");
                    const directionValue = isDirectionItem ? item.action.split(".")[1] : null;
                    const isActive = isDirectionItem && directionValue === currentDirection;

                    return (
                        <div key={item.id}>
                            {item.separator === "before" && index > 0 && <ContextMenuSeparator />}
                            <ContextMenuItem
                                danger={item.danger}
                                active={isActive}
                                shortcut={item.shortcut}
                                onClick={() => {
                                    executeMenuAction(item.action, context);
                                    closeContextMenu();
                                }}
                            >
                                {t(item.label)}
                            </ContextMenuItem>
                            {item.separator === "after" && <ContextMenuSeparator />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ContextMenuItem({
    children,
    onClick,
    danger,
    active,
    shortcut,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    active?: boolean;
    shortcut?: string;
}) {
    return (
        <div
            className={`graph-context-item ${danger ? "graph-context-item--danger" : ""} ${active ? "graph-context-item--active" : ""}`}
            onClick={onClick}
        >
            <span className="graph-context-item__label">
                {active && <span style={{ marginRight: 6 }}>✓</span>}
                {children}
            </span>
            {shortcut && <span className="graph-context-item__shortcut">{shortcut}</span>}
        </div>
    );
}

function ContextMenuSeparator() {
    return <div className="graph-context-separator" />;
}
