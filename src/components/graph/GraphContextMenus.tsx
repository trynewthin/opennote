import { configService } from "@/services/configService";
import { useGraphStore } from "@/stores/graphStore";
import type { RelationSemanticConfig } from "@/types";

export function GraphContextMenus() {
    const {
        contextMenu,
        closeContextMenu,
        createNode,
        deleteNode,
        startEditNode,
        openEditNodeDialog,
        relations,
        deleteRelation,
        updateRelation,
    } = useGraphStore();

    if (!contextMenu.show) return null;

    const currentRelation =
        contextMenu.type === "relation" && contextMenu.targetId
            ? relations.find((relation) => relation.id === contextMenu.targetId)
            : null;
    const currentDirection =
        configService.parse<RelationSemanticConfig>(currentRelation?.semantic_config ?? null, {})?.direction ?? "none";

    const changeRelationDirection = async (direction: "none" | "forward" | "backward") => {
        if (!currentRelation) return;
        await updateRelation(currentRelation.id, currentRelation.content, direction);
        closeContextMenu();
    };

    return (
        <div
            className="graph-context-overlay"
            onContextMenu={(event) => {
                event.preventDefault();
                closeContextMenu();
            }}
            onClick={closeContextMenu}
        >
            <div
                style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y }}
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
            >
                {contextMenu.type === "canvas" && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            onClick={() => {
                                createNode("New node");
                                closeContextMenu();
                            }}
                        >
                            Add node
                        </ContextMenuItem>
                    </div>
                )}

                {contextMenu.type === "node" && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) startEditNode(contextMenu.targetId);
                                closeContextMenu();
                            }}
                        >
                            Quick edit
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) openEditNodeDialog(contextMenu.targetId);
                                closeContextMenu();
                            }}
                        >
                            Edit node
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            danger
                            onClick={() => {
                                if (contextMenu.targetId) void deleteNode(contextMenu.targetId);
                                closeContextMenu();
                            }}
                        >
                            Delete node
                        </ContextMenuItem>
                    </div>
                )}

                {contextMenu.type === "relation" && currentRelation && (
                    <div className="graph-context-menu">
                        <ContextMenuItem active={currentDirection === "none"} onClick={() => void changeRelationDirection("none")}>
                            No direction
                        </ContextMenuItem>
                        <ContextMenuItem
                            active={currentDirection === "forward"}
                            onClick={() => void changeRelationDirection("forward")}
                        >
                            Forward
                        </ContextMenuItem>
                        <ContextMenuItem
                            active={currentDirection === "backward"}
                            onClick={() => void changeRelationDirection("backward")}
                        >
                            Backward
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            danger
                            onClick={() => {
                                void deleteRelation(currentRelation.id);
                                closeContextMenu();
                            }}
                        >
                            Delete relation
                        </ContextMenuItem>
                    </div>
                )}
            </div>
        </div>
    );
}

function ContextMenuItem({
    children,
    onClick,
    danger,
    active,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    active?: boolean;
}) {
    return (
        <div
            className={`graph-context-item ${danger ? "graph-context-item--danger" : ""} ${active ? "graph-context-item--active" : ""}`}
            onClick={onClick}
        >
            {active && <span style={{ marginRight: 6 }}>✓</span>}
            {children}
        </div>
    );
}

function ContextMenuSeparator() {
    return <div className="graph-context-separator" />;
}
