import { useGraphStore } from "@/stores/graphStore";
import { graphApi } from "@/services/graphApi";

export function GraphContextMenus() {
    const {
        contextMenu, closeContextMenu, setNodeExpanded, createNode, deleteNode,
        expandedNodeIds, startRenameNode, links, deleteLink,
        openEditContentDialog, openAddContentDialog,
    } = useGraphStore();

    if (!contextMenu.show) return null;

    const isExpanded = contextMenu.targetId ? expandedNodeIds.includes(contextMenu.targetId) : false;

    // Find link for direction display
    const currentLink = contextMenu.type === "link" && contextMenu.targetId
        ? links.find((l) => l.id === contextMenu.targetId)
        : null;

    const changeLinkDirection = async (direction: string) => {
        if (!currentLink) return;
        try {
            const updated = await graphApi.updateLink(
                currentLink.id,
                currentLink.label,
                direction,
                currentLink.link_type,
                currentLink.weight,
                currentLink.sort_order,
            );
            // Update store
            useGraphStore.setState((s) => ({
                links: s.links.map((l) => (l.id === updated.id ? updated : l)),
            }));
        } catch (err) {
            console.error("Failed to update link direction:", err);
        }
        closeContextMenu();
    };

    return (
        <div
            className="graph-context-overlay"
            onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
            }}
            onClick={closeContextMenu}
        >
            <div
                style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {/* ─── 空白区域 ─── */}
                {contextMenu.type === "canvas" && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            onClick={() => {
                                createNode("新节点");
                                closeContextMenu();
                            }}
                        >
                            添加节点
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem>整理</ContextMenuItem>
                    </div>
                )}

                {/* ─── 节点 ─── */}
                {contextMenu.type === "node" && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) {
                                    startRenameNode(contextMenu.targetId);
                                }
                                closeContextMenu();
                            }}
                        >
                            重命名
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) {
                                    openAddContentDialog(contextMenu.targetId);
                                }
                                closeContextMenu();
                            }}
                        >
                            添加内容
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) {
                                    setNodeExpanded(contextMenu.targetId, !isExpanded);
                                }
                                closeContextMenu();
                            }}
                        >
                            {isExpanded ? "隐藏内容" : "显示内容"}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            danger
                            onClick={() => {
                                if (contextMenu.targetId) {
                                    deleteNode(contextMenu.targetId);
                                }
                                closeContextMenu();
                            }}
                        >
                            删除
                        </ContextMenuItem>
                    </div>
                )}

                {/* ─── 内容 ─── */}
                {contextMenu.type === "content" && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            onClick={() => {
                                if (contextMenu.targetId) {
                                    openEditContentDialog(contextMenu.targetId);
                                }
                                closeContextMenu();
                            }}
                        >
                            编辑
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            danger
                            onClick={async () => {
                                if (contextMenu.targetId) {
                                    try {
                                        await graphApi.deleteContent(contextMenu.targetId);
                                        useGraphStore.setState((s) => ({
                                            contents: s.contents.filter((c) => c.id !== contextMenu.targetId),
                                            nodeContentRels: s.nodeContentRels.filter((r) => r.content_id !== contextMenu.targetId),
                                        }));
                                    } catch (err) {
                                        console.error("Failed to delete content:", err);
                                    }
                                }
                                closeContextMenu();
                            }}
                        >
                            删除
                        </ContextMenuItem>
                    </div>
                )}

                {/* ─── 连线 ─── */}
                {contextMenu.type === "link" && currentLink && (
                    <div className="graph-context-menu">
                        <ContextMenuItem
                            active={currentLink.direction === "none"}
                            onClick={() => changeLinkDirection("none")}
                        >
                            无箭头
                        </ContextMenuItem>
                        <ContextMenuItem
                            active={currentLink.direction === "forward"}
                            onClick={() => changeLinkDirection("forward")}
                        >
                            →
                        </ContextMenuItem>
                        <ContextMenuItem
                            active={currentLink.direction === "backward"}
                            onClick={() => changeLinkDirection("backward")}
                        >
                            ←
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            danger
                            onClick={() => {
                                deleteLink(currentLink.id);
                                closeContextMenu();
                            }}
                        >
                            解除关联
                        </ContextMenuItem>
                    </div>
                )}
            </div>
        </div>
    );
}

function ContextMenuItem({ children, onClick, danger, active }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; active?: boolean }) {
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
