import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGraphStore } from "@/stores/graphStore";
import { useThemeStore } from "@/stores/themeStore";
import { themeLoader } from "@/services/themeLoader";
import { configService } from "@/services/configService";
import { getNodeType } from "@/lib/nodeTypeRegistry";
import type { Node, NodeViewConfig, Relation, RelationSemanticConfig } from "@/types";
import { GraphContextMenus } from "./GraphContextMenus";
import { GraphNode } from "./GraphNode";
import { FilePreviewDialog } from "./FilePreviewDialog";

function parseNodeView(node: Node): NodeViewConfig {
    return configService.parse<NodeViewConfig>(node.view_config, {}) ?? {};
}

function parseRelationSemantic(relation: Relation): RelationSemanticConfig {
    return configService.parse<RelationSemanticConfig>(relation.semantic_config, {}) ?? {};
}

function nodePosition(node: Node) {
    const view = parseNodeView(node);
    return { x: view.x ?? 0, y: view.y ?? 0 };
}

export function GraphCanvas() {
    const {
        nodes,
        relations,
        openContextMenu,
        closeContextMenu,
        contextMenu,
        updateNodePosition,
        updateNodeViewConfig,
        editingNodeId,
        updateNode,
        cancelEditNode,
        createRelation,
        updateRelation,
        transform,
        setTransform,
        startEditNode,
    } = useGraphStore();

    const isDark = useThemeStore((state) => state.theme === "dark");
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
    const panState = useRef({ isPanning: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });
    const dragState = useRef({
        isPending: false,
        isDragging: false,
        nodeId: "",
        startX: 0,
        startY: 0,
        startNodeX: 0,
        startNodeY: 0,
        startTime: 0,
    });

    const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});
    const nodeSizes = useRef<Map<string, { w: number; h: number }>>(new Map());
    const [hoveredRelationId, setHoveredRelationId] = useState<string | null>(null);
    const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
    const [editingRelationContent, setEditingRelationContent] = useState("");
    const [relationSourceId, setRelationSourceId] = useState<string | null>(null);
    const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
    const clickTimer = useRef<{ nodeId: string; timer: ReturnType<typeof setTimeout> } | null>(null);

    const handleNodeSizeChange = useCallback((nodeId: string, width: number, height: number) => {
        nodeSizes.current.set(nodeId, { w: width, h: height });
    }, []);

    const getNodeWorldPosition = useCallback(
        (nodeId: string) => {
            const node = nodeMap.get(nodeId);
            if (!node) return null;
            return dragPos[nodeId] ?? nodePosition(node);
        },
        [dragPos, nodeMap],
    );

    const clampTransform = useCallback(
        (tx: number, ty: number, scale: number): { x: number; y: number; scale: number } => {
            if (nodes.length === 0) return { x: tx, y: ty, scale };

            const canvas = containerRef.current;
            const vw = canvas?.clientWidth ?? window.innerWidth;
            const vh = canvas?.clientHeight ?? window.innerHeight;

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (const node of nodes) {
                const position = dragPos[node.id] ?? nodePosition(node);
                const size = nodeSizes.current.get(node.id) ?? { w: 80, h: 32 };
                minX = Math.min(minX, position.x - size.w / 2);
                minY = Math.min(minY, position.y - size.h / 2);
                maxX = Math.max(maxX, position.x + size.w / 2);
                maxY = Math.max(maxY, position.y + size.h / 2);
            }

            const padding = 500;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            return {
                x: Math.max(vw / 2 - maxX * scale, Math.min(vw / 2 - minX * scale, tx)),
                y: Math.max(vh / 2 - maxY * scale, Math.min(vh / 2 - minY * scale, ty)),
                scale,
            };
        },
        [dragPos, nodes],
    );

    const onCanvasMouseDown = useCallback(
        (event: React.MouseEvent) => {
            if (event.button !== 0) return;
            if ((event.target as HTMLElement).closest("[data-node-id]")) return;
            if (relationSourceId) {
                setRelationSourceId(null);
                return;
            }

            panState.current = {
                isPanning: true,
                startX: event.clientX,
                startY: event.clientY,
                startTx: transform.x,
                startTy: transform.y,
            };
        },
        [relationSourceId, transform.x, transform.y],
    );

    const onNodeMouseDown = useCallback(
        (event: React.MouseEvent, nodeId: string) => {
            if (event.button !== 0) return;
            event.stopPropagation();

            if (relationSourceId) {
                if (relationSourceId !== nodeId) {
                    void createRelation(relationSourceId, nodeId);
                }
                setRelationSourceId(null);
                return;
            }

            if (event.shiftKey) {
                setRelationSourceId(nodeId);
                return;
            }

            const node = nodeMap.get(nodeId);
            if (!node) return;
            const position = dragPos[nodeId] ?? nodePosition(node);
            dragState.current = {
                isPending: true,
                isDragging: false,
                nodeId,
                startX: event.clientX,
                startY: event.clientY,
                startNodeX: position.x,
                startNodeY: position.y,
                startTime: Date.now(),
            };
        },
        [createRelation, dragPos, nodeMap, relationSourceId],
    );

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            if (event.buttons === 0) {
                panState.current.isPanning = false;
                dragState.current.isDragging = false;
                dragState.current.isPending = false;
                return;
            }

            if (panState.current.isPanning) {
                const rawX = panState.current.startTx + (event.clientX - panState.current.startX);
                const rawY = panState.current.startTy + (event.clientY - panState.current.startY);
                setTransform(clampTransform(rawX, rawY, transform.scale));
            }

            if (dragState.current.isPending && !dragState.current.isDragging) {
                const distanceX = Math.abs(event.clientX - dragState.current.startX);
                const distanceY = Math.abs(event.clientY - dragState.current.startY);
                const elapsed = Date.now() - dragState.current.startTime;
                const threshold = elapsed < 200 ? 5 : 1;
                if (distanceX > threshold || distanceY > threshold) {
                    dragState.current.isDragging = true;
                    dragState.current.isPending = false;
                }
            }

            if (dragState.current.isDragging) {
                const deltaX = (event.clientX - dragState.current.startX) / transform.scale;
                const deltaY = (event.clientY - dragState.current.startY) / transform.scale;
                let nextX = dragState.current.startNodeX + deltaX;
                let nextY = dragState.current.startNodeY + deltaY;

                const gap = 8;
                for (const otherNode of nodes) {
                    if (otherNode.id === dragState.current.nodeId) continue;
                    const otherPosition = dragPos[otherNode.id] ?? nodePosition(otherNode);
                    const selfSize = nodeSizes.current.get(dragState.current.nodeId) ?? { w: 80, h: 32 };
                    const otherSize = nodeSizes.current.get(otherNode.id) ?? { w: 80, h: 32 };
                    const halfW = (selfSize.w + otherSize.w) / 2 + gap;
                    const halfH = (selfSize.h + otherSize.h) / 2 + gap;
                    const dx = nextX - otherPosition.x;
                    const dy = nextY - otherPosition.y;
                    const overlapX = halfW - Math.abs(dx);
                    const overlapY = halfH - Math.abs(dy);
                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            nextX += dx >= 0 ? overlapX : -overlapX;
                        } else {
                            nextY += dy >= 0 ? overlapY : -overlapY;
                        }
                    }
                }

                setDragPos((current) => ({
                    ...current,
                    [dragState.current.nodeId]: { x: nextX, y: nextY },
                }));
            }
        };

        const onMouseUp = () => {
            if (dragState.current.isDragging) {
                const position = dragPos[dragState.current.nodeId];
                if (position) {
                    void updateNodePosition(dragState.current.nodeId, position.x, position.y);
                }
            }
            dragState.current.isDragging = false;
            dragState.current.isPending = false;
            panState.current.isPanning = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [clampTransform, dragPos, nodes, setTransform, transform.scale, updateNodePosition]);

    useEffect(() => {
        setDragPos({});
    }, [nodes]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const handler = (event: WheelEvent) => {
            if ((event.target as HTMLElement).closest(".file-preview-overlay, .file-preview-dialog")) return;
            event.preventDefault();
            const rect = element.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomFactor));
            const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
            const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
            setTransform(clampTransform(newX, newY, newScale));
        };

        element.addEventListener("wheel", handler, { passive: false });
        return () => element.removeEventListener("wheel", handler);
    }, [clampTransform, setTransform, transform.scale, transform.x, transform.y]);

    const onCanvasContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            if ((event.target as HTMLElement).closest("[data-node-id]")) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const worldX = (event.clientX - rect.left - transform.x) / transform.scale;
            const worldY = (event.clientY - rect.top - transform.y) / transform.scale;
            openContextMenu({ x: event.clientX, y: event.clientY, worldX, worldY, type: "canvas" });
        },
        [openContextMenu, transform.scale, transform.x, transform.y],
    );

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, nodeId: string) => {
            event.preventDefault();
            event.stopPropagation();
            openContextMenu({ x: event.clientX, y: event.clientY, worldX: 0, worldY: 0, type: "node", targetId: nodeId });
        },
        [openContextMenu],
    );

    const dotColor = isDark ? "rgba(161,161,170,0.15)" : "rgba(161,161,170,0.25)";
    const gridSize = 24 * transform.scale;
    const gridOffsetX = transform.x % gridSize;
    const gridOffsetY = transform.y % gridSize;
    const dotSize = 1.5 * transform.scale;

    return (
        <div
            ref={containerRef}
            className="graph-canvas relative h-full w-full overflow-hidden select-none bg-background"
            style={{
                backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
                cursor: relationSourceId ? "crosshair" : panState.current.isPanning ? "grabbing" : "grab",
            }}
            onMouseDown={onCanvasMouseDown}
            onContextMenu={onCanvasContextMenu}
            onClick={() => {
                if (contextMenu.show) closeContextMenu();
            }}
        >
            <div
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: "0 0",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <svg className="graph-canvas__svg">
                    <defs>
                        <marker id="arrow-light" viewBox="0 0 8 6" refX={7} refY={3} markerWidth={5} markerHeight={4} orient="auto-start-reverse">
                            <path d="M 0 0.5 L 7 3 L 0 5.5" fill="none" stroke="rgba(107,114,128,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
                        </marker>
                        <marker id="arrow-dark" viewBox="0 0 8 6" refX={7} refY={3} markerWidth={5} markerHeight={4} orient="auto-start-reverse">
                            <path d="M 0 0.5 L 7 3 L 0 5.5" fill="none" stroke="rgba(156,163,175,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
                        </marker>
                    </defs>

                    {relations.map((relation) => {
                        const sourcePosition = getNodeWorldPosition(relation.source);
                        const targetPosition = getNodeWorldPosition(relation.target);
                        if (!sourcePosition || !targetPosition) return null;

                        const style = themeLoader.link(isDark, relation.view_config);
                        const direction = parseRelationSemantic(relation).direction ?? "none";
                        const isHovered = hoveredRelationId === relation.id;
                        const arrowId = isDark ? "arrow-dark" : "arrow-light";

                        return (
                            <g key={relation.id} className="graph-link">
                                <line
                                    className="graph-link__hit"
                                    x1={sourcePosition.x}
                                    y1={sourcePosition.y}
                                    x2={targetPosition.x}
                                    y2={targetPosition.y}
                                    onMouseEnter={() => setHoveredRelationId(relation.id)}
                                    onMouseLeave={() => setHoveredRelationId(null)}
                                    onContextMenu={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        openContextMenu({
                                            x: event.clientX,
                                            y: event.clientY,
                                            worldX: 0,
                                            worldY: 0,
                                            type: "relation",
                                            targetId: relation.id,
                                        });
                                    }}
                                    onDoubleClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setEditingRelationId(relation.id);
                                        setEditingRelationContent(relation.content ?? "");
                                    }}
                                />
                                {isHovered && (
                                    <line
                                        x1={sourcePosition.x}
                                        y1={sourcePosition.y}
                                        x2={targetPosition.x}
                                        y2={targetPosition.y}
                                        stroke={isDark ? "rgba(200,200,200,0.3)" : "rgba(100,100,100,0.25)"}
                                        strokeWidth={6}
                                        strokeLinecap="round"
                                    />
                                )}
                                <line
                                    className="graph-link__line"
                                    x1={sourcePosition.x}
                                    y1={sourcePosition.y}
                                    x2={targetPosition.x}
                                    y2={targetPosition.y}
                                    stroke={style.stroke}
                                    strokeWidth={style.strokeWidth}
                                    strokeDasharray={style.strokeDasharray}
                                    markerEnd={direction === "forward" ? `url(#${arrowId})` : undefined}
                                    markerStart={direction === "backward" ? `url(#${arrowId})` : undefined}
                                />
                                {editingRelationId === relation.id ? (
                                    <foreignObject
                                        x={(sourcePosition.x + targetPosition.x) / 2 - 60}
                                        y={(sourcePosition.y + targetPosition.y) / 2 - 12}
                                        width={120}
                                        height={24}
                                        style={{ overflow: "visible" }}
                                    >
                                        <input
                                            value={editingRelationContent}
                                            onChange={(event) => setEditingRelationContent(event.target.value)}
                                            onBlur={() => {
                                                setEditingRelationId(null);
                                                const directionValue = parseRelationSemantic(relation).direction ?? "none";
                                                void updateRelation(
                                                    relation.id,
                                                    editingRelationContent.trim() || null,
                                                    directionValue,
                                                );
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.currentTarget.blur();
                                                } else if (event.key === "Escape") {
                                                    setEditingRelationId(null);
                                                }
                                            }}
                                            onMouseDown={(event) => event.stopPropagation()}
                                            autoFocus
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                textAlign: "center",
                                                background: isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                                                border: `1px solid ${isDark ? "#4B5563" : "#D1D5DB"}`,
                                                borderRadius: "4px",
                                                color: isDark ? "#E5E7EB" : "#374151",
                                                fontSize: "12px",
                                                outline: "none",
                                                padding: "0 6px",
                                            }}
                                        />
                                    </foreignObject>
                                ) : relation.content ? (
                                    <text
                                        x={(sourcePosition.x + targetPosition.x) / 2}
                                        y={(sourcePosition.y + targetPosition.y) / 2 + 4}
                                        textAnchor="middle"
                                        fill={isDark ? "rgba(156,163,175,0.6)" : "rgba(107,114,128,0.55)"}
                                        fontSize={11}
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {relation.content}
                                    </text>
                                ) : null}
                            </g>
                        );
                    })}
                </svg>

                {nodes.map((node) => {
                    const position = dragPos[node.id] ?? nodePosition(node);
                    return (
                        <GraphNode
                            key={node.id}
                            node={node}
                            pos={position}
                            isEditing={editingNodeId === node.id}
                            isLinkSource={relationSourceId === node.id}
                            zIndex={dragState.current.isDragging && dragState.current.nodeId === node.id ? 10 : 1}
                            onMouseDown={onNodeMouseDown}
                            onContextMenu={onNodeContextMenu}
                            onClick={(event, nodeId) => {
                                if (event.detail === 2) {
                                    if (clickTimer.current) {
                                        clearTimeout(clickTimer.current.timer);
                                        clickTimer.current = null;
                                    }
                                    startEditNode(nodeId);
                                } else if (event.detail === 1) {
                                    if (clickTimer.current) clearTimeout(clickTimer.current.timer);
                                    if (getNodeType(node.type).category === "resource") {
                                        clickTimer.current = {
                                            nodeId,
                                            timer: setTimeout(() => {
                                                clickTimer.current = null;
                                                setPreviewNodeId((current) => (current === nodeId ? null : nodeId));
                                            }, 250),
                                        };
                                    }
                                }
                            }}
                            onRename={(nodeId, newLabel) => {
                                if (getNodeType(node.type).category === "resource") {
                                    void updateNodeViewConfig(nodeId, { label: newLabel });
                                    cancelEditNode();
                                } else {
                                    void updateNode(nodeId, node.type, newLabel);
                                }
                            }}
                            onCancelRename={cancelEditNode}
                            onSizeChange={handleNodeSizeChange}
                        />
                    );
                })}
            </div>

            <GraphContextMenus />

            {previewNodeId && (
                <FilePreviewDialog nodeId={previewNodeId} onClose={() => setPreviewNodeId(null)} />
            )}
        </div>
    );
}
