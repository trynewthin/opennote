import { useCallback, useEffect, useRef, useState } from "react";
import { useGraphStore } from "@/stores/graphStore";
import { useThemeStore } from "@/stores/themeStore";
import { themeLoader } from "@/services/themeLoader";
import { GraphContextMenus } from "./GraphContextMenus";
import { GraphNode } from "./GraphNode";

/**
 * Custom Canvas — pure HTML/CSS, no third-party dependencies.
 * Pan:  mousedown on empty space + drag
 * Zoom: wheel
 * Drag: mousedown on node + drag
 */
export function GraphCanvas() {
    const {
        nodes,
        links,
        expandedNodeIds,
        contents,
        nodeContentRels,
        setNodeExpanded,
        openContextMenu,
        closeContextMenu,
        contextMenu,
        updateNodePosition,
        editingNodeId,
        renameNode,
        cancelRename,
        updateContentRelPosition,
        createLink,
        updateLink,
        transform,
        setTransform,
        openEditContentDialog,
    } = useGraphStore();

    const isDark = useThemeStore((s) => s.theme === "dark");

    const containerRef = useRef<HTMLDivElement>(null);
    // Keep latest refs for use in global event handlers
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;

    // Track panning state
    const panState = useRef<{ isPanning: boolean; startX: number; startY: number; startTx: number; startTy: number }>({
        isPanning: false, startX: 0, startY: 0, startTx: 0, startTy: 0,
    });

    // Track node drag state (isPending = mousedown but not yet moved enough)
    const dragState = useRef<{ isPending: boolean; isDragging: boolean; nodeId: string; startX: number; startY: number; startNodeX: number; startNodeY: number; startTime: number }>({
        isPending: false, isDragging: false, nodeId: "", startX: 0, startY: 0, startNodeX: 0, startNodeY: 0, startTime: 0,
    });

    // Local node positions for smooth dragging
    const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});

    // Track content drag state
    const propDragState = useRef<{ isDragging: boolean; isPending: boolean; propId: string; nodeId: string; startX: number; startY: number; startPosX: number; startPosY: number; areaCenterX: number; areaCenterY: number; startTime: number }>({
        isDragging: false, isPending: false, propId: "", nodeId: "", startX: 0, startY: 0, startPosX: 0, startPosY: 0, areaCenterX: 0, areaCenterY: 0, startTime: 0,
    });
    const [propDragPos, setPropDragPos] = useState<Record<string, { x: number; y: number }>>({});

    // Hovered link for highlight
    const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

    // Link label editing
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
    const [editingLinkLabel, setEditingLinkLabel] = useState("");

    // Shift+click link creation: first click selects source, second click targets
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

    // Helper: measure actual node panel size from DOM (prefer center panel over expanded area)
    const getNodeHalfSize = useCallback((nodeId: string) => {
        const container = containerRef.current;
        if (!container) return { hw: 30, hh: 18 };
        // For expanded nodes: find the center panel (.graph-node) inside the expanded area
        const expanded = container.querySelector(`[data-node-id="${nodeId}"].graph-node-expanded`);
        if (expanded) {
            const center = expanded.querySelector('.graph-node') as HTMLElement | null;
            if (center) return { hw: center.offsetWidth / 2, hh: center.offsetHeight / 2 };
        }
        // For simple nodes
        const el = container.querySelector(`[data-node-id="${nodeId}"].graph-node`) as HTMLElement | null;
        if (el) return { hw: el.offsetWidth / 2, hh: el.offsetHeight / 2 };
        return { hw: 30, hh: 18 };
    }, []);

    // ─── Pan ───
    const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        // Only pan on left click on the canvas itself (not on nodes)
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest("[data-node-id]")) return;

        // Cancel link mode on empty space click
        if (linkSourceId) {
            setLinkSourceId(null);
            return;
        }

        panState.current = {
            isPanning: true,
            startX: e.clientX,
            startY: e.clientY,
            startTx: transform.x,
            startTy: transform.y,
        };
    }, [transform, linkSourceId]);

    // ─── Node drag / link click ───
    const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        // If in link mode (source already selected), create link to this node
        if (linkSourceId) {
            if (nodeId !== linkSourceId) {
                createLink(linkSourceId, nodeId);
            }
            setLinkSourceId(null);
            return;
        }

        // Shift+click = select as link source
        if (e.shiftKey) {
            setLinkSourceId(nodeId);
            return;
        }


        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const pos = dragPos[nodeId] ?? { x: node.x, y: node.y };

        dragState.current = {
            isPending: true,
            isDragging: false,
            nodeId,
            startX: e.clientX,
            startY: e.clientY,
            startNodeX: pos.x,
            startNodeY: pos.y,
            startTime: Date.now(),
        };
    }, [nodes, dragPos, linkSourceId, createLink]);

    // ─── Global mouse move / up ───
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            // Guard: if no mouse button is pressed, force-reset all states
            // This prevents "sticky" drag when mouseup was missed
            if (e.buttons === 0) {
                if (panState.current.isPanning) panState.current.isPanning = false;
                if (dragState.current.isDragging || dragState.current.isPending) {
                    dragState.current.isDragging = false;
                    dragState.current.isPending = false;
                }
                if (propDragState.current.isDragging || propDragState.current.isPending) {
                    propDragState.current.isDragging = false;
                    propDragState.current.isPending = false;
                }
                return;
            }

            if (panState.current.isPanning) {
                const dx = e.clientX - panState.current.startX;
                const dy = e.clientY - panState.current.startY;
                setTransform({
                    x: panState.current.startTx + dx,
                    y: panState.current.startTy + dy,
                    scale: transform.scale,
                });
            }

            // Time-based drag threshold:
            //   <200ms since mousedown → need 5px movement (protect double-click)
            //   ≥200ms → any 1px movement starts drag (responsive dragging)
            if (dragState.current.isPending && !dragState.current.isDragging) {
                const dx = Math.abs(e.clientX - dragState.current.startX);
                const dy = Math.abs(e.clientY - dragState.current.startY);
                const elapsed = Date.now() - dragState.current.startTime;
                const threshold = elapsed < 200 ? 5 : 1;
                if (dx > threshold || dy > threshold) {
                    dragState.current.isDragging = true;
                    dragState.current.isPending = false;
                }
            }

            if (dragState.current.isDragging) {
                const ddx = (e.clientX - dragState.current.startX) / transform.scale;
                const ddy = (e.clientY - dragState.current.startY) / transform.scale;
                let newX = dragState.current.startNodeX + ddx;
                let newY = dragState.current.startNodeY + ddy;

                // Enforce minimum distance from other nodes
                const MIN_NODE_DIST = 100;
                const draggedId = dragState.current.nodeId;
                for (const other of nodesRef.current) {
                    if (other.id === draggedId) continue;
                    const op = dragPos[other.id] ?? { x: other.x, y: other.y };
                    const rx = newX - op.x;
                    const ry = newY - op.y;
                    const dist = Math.sqrt(rx * rx + ry * ry);
                    if (dist < MIN_NODE_DIST && dist > 0.01) {
                        // Push dragged node away along repulsion vector
                        newX = op.x + (rx / dist) * MIN_NODE_DIST;
                        newY = op.y + (ry / dist) * MIN_NODE_DIST;
                    }
                }

                setDragPos((prev) => ({
                    ...prev,
                    [dragState.current.nodeId]: { x: newX, y: newY },
                }));
            }

            // Property drag threshold
            if (propDragState.current.isPending && !propDragState.current.isDragging) {
                const dx = Math.abs(e.clientX - propDragState.current.startX);
                const dy = Math.abs(e.clientY - propDragState.current.startY);
                const elapsed = Date.now() - propDragState.current.startTime;
                const threshold = elapsed < 200 ? 5 : 1;
                if (dx > threshold || dy > threshold) {
                    propDragState.current.isDragging = true;
                    propDragState.current.isPending = false;
                }
            }

            // Property drag move
            if (propDragState.current.isDragging) {
                const dx = (e.clientX - propDragState.current.startX) / transform.scale;
                const dy = (e.clientY - propDragState.current.startY) / transform.scale;
                let newX = propDragState.current.startPosX + dx;
                let newY = propDragState.current.startPosY + dy;

                // Clamp to max distance from area center
                const MAX_DIST = 260;
                const cx = propDragState.current.areaCenterX;
                const cy = propDragState.current.areaCenterY;
                const distX = newX - cx;
                const distY = newY - cy;
                const dist = Math.sqrt(distX * distX + distY * distY);
                if (dist > MAX_DIST) {
                    newX = cx + (distX / dist) * MAX_DIST;
                    newY = cy + (distY / dist) * MAX_DIST;
                }

                // Enforce minimum distance between content pills
                const MIN_PROP_DIST = 60;
                const draggedPropId = propDragState.current.propId;
                const siblingRels = nodeContentRels.filter(
                    (r) => r.node_id === propDragState.current.nodeId && r.content_id !== draggedPropId
                );
                for (const sib of siblingRels) {
                    // Get sibling's current position (drag override or stored)
                    const sibPos = propDragPos[sib.content_id] ?? { x: cx + sib.rel_x, y: cy + sib.rel_y };
                    const rx = newX - sibPos.x;
                    const ry = newY - sibPos.y;
                    const d = Math.sqrt(rx * rx + ry * ry);
                    if (d < MIN_PROP_DIST && d > 0.01) {
                        newX = sibPos.x + (rx / d) * MIN_PROP_DIST;
                        newY = sibPos.y + (ry / d) * MIN_PROP_DIST;
                    }
                }

                setPropDragPos((prev) => ({
                    ...prev,
                    [propDragState.current.propId]: { x: newX, y: newY },
                }));
            }
        };

        const onMouseUp = () => {
            if (dragState.current.isDragging) {
                const { nodeId } = dragState.current;
                const pos = dragPos[nodeId];
                if (pos) {
                    updateNodePosition(nodeId, pos.x, pos.y);
                }
                dragState.current.isDragging = false;
                dragState.current.isPending = false;
            }
            panState.current.isPanning = false;

            // Content drag end
            if (propDragState.current.isDragging) {
                const { propId, nodeId, areaCenterX, areaCenterY } = propDragState.current;
                const pos = propDragPos[propId];
                if (pos) {
                    const relX = pos.x - areaCenterX;
                    const relY = pos.y - areaCenterY;
                    updateContentRelPosition(nodeId, propId, relX, relY);
                }
            }
            propDragState.current.isDragging = false;
            propDragState.current.isPending = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [transform, dragPos, updateNodePosition, createLink]);

    // Clear drag overrides when store nodes update
    useEffect(() => {
        setDragPos({});
    }, [nodes]);

    // ─── Zoom ───
    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomFactor));

        // Zoom towards cursor
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

        setTransform({ x: newX, y: newY, scale: newScale });
    }, [transform]);

    // ─── Context Menu ───
    const onCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if ((e.target as HTMLElement).closest("[data-node-id]")) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const worldX = (e.clientX - rect.left - transform.x) / transform.scale;
        const worldY = (e.clientY - rect.top - transform.y) / transform.scale;

        openContextMenu({ x: e.clientX, y: e.clientY, worldX, worldY, type: "canvas" });
    }, [openContextMenu, transform]);

    const onNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu({ x: e.clientX, y: e.clientY, worldX: 0, worldY: 0, type: "node", targetId: nodeId });
    }, [openContextMenu]);

    const onCanvasClick = useCallback(() => {
        if (contextMenu.show) closeContextMenu();
    }, [contextMenu.show, closeContextMenu]);

    // ─── Dot grid background ───
    const dotColor = isDark ? "rgba(161,161,170,0.15)" : "rgba(161,161,170,0.25)";

    const gridSize = 24 * transform.scale;
    const gridOffsetX = transform.x % gridSize;
    const gridOffsetY = transform.y % gridSize;
    const dotSize = 1.5 * transform.scale;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none bg-background"
            style={{
                backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
                cursor: linkSourceId ? "crosshair" : panState.current.isPanning ? "grabbing" : "grab",
            }}
            onMouseDown={onCanvasMouseDown}
            onWheel={onWheel}
            onContextMenu={onCanvasContextMenu}
            onClick={onCanvasClick}
        >
            {/* Transform layer */}
            <div
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: "0 0",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                {/* ── Inter-node link lines ── */}
                <svg className="graph-canvas__svg">
                    {/* Arrow marker definitions */}
                    <defs>
                        <marker
                            id="arrow-light"
                            viewBox="0 0 8 6"
                            refX={7} refY={3}
                            markerWidth={5} markerHeight={4}
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0.5 L 7 3 L 0 5.5" fill="none" stroke="rgba(107,114,128,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
                        </marker>
                        <marker
                            id="arrow-dark"
                            viewBox="0 0 8 6"
                            refX={7} refY={3}
                            markerWidth={5} markerHeight={4}
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0.5 L 7 3 L 0 5.5" fill="none" stroke="rgba(156,163,175,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
                        </marker>
                    </defs>

                    {links.map((link) => {
                        const src = nodes.find((n) => n.id === link.source_id);
                        const tgt = nodes.find((n) => n.id === link.target_id);
                        if (!src || !tgt) return null;
                        const sp = dragPos[src.id] ?? { x: src.x, y: src.y };
                        const tp = dragPos[tgt.id] ?? { x: tgt.x, y: tgt.y };
                        const linkStyle = themeLoader.link(isDark, link.config);
                        const isHovered = hoveredLinkId === link.id;
                        const arrowId = isDark ? "arrow-dark" : "arrow-light";
                        const markerEnd = link.direction === "forward" ? `url(#${arrowId})` : undefined;
                        const markerStart = link.direction === "backward" ? `url(#${arrowId})` : undefined;

                        // Measure actual node panel size from DOM
                        const dx = tp.x - sp.x;
                        const dy = tp.y - sp.y;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const ux = dx / len, uy = dy / len;
                        const srcSize = getNodeHalfSize(src.id);
                        const tgtSize = getNodeHalfSize(tgt.id);
                        // Distance from center to rect edge along direction
                        let srcD = Math.min(
                            Math.abs(ux) > 0.001 ? srcSize.hw / Math.abs(ux) : 9999,
                            Math.abs(uy) > 0.001 ? srcSize.hh / Math.abs(uy) : 9999
                        ) + 4;
                        let tgtD = Math.min(
                            Math.abs(ux) > 0.001 ? tgtSize.hw / Math.abs(ux) : 9999,
                            Math.abs(uy) > 0.001 ? tgtSize.hh / Math.abs(uy) : 9999
                        ) + 4;
                        // Clamp: total inset must not exceed 80% of line length
                        const maxInset = len * 0.4;
                        if (srcD > maxInset) srcD = maxInset;
                        if (tgtD > maxInset) tgtD = maxInset;
                        const x1 = sp.x + ux * srcD, y1 = sp.y + uy * srcD;
                        const x2 = tp.x - ux * tgtD, y2 = tp.y - uy * tgtD;
                        return (
                            <g key={link.id} className="graph-link">
                                {/* Transparent thick hit area */}
                                <line
                                    className="graph-link__hit"
                                    x1={sp.x} y1={sp.y}
                                    x2={tp.x} y2={tp.y}
                                    onMouseEnter={() => setHoveredLinkId(link.id)}
                                    onMouseLeave={() => setHoveredLinkId(null)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            worldX: 0,
                                            worldY: 0,
                                            type: "link",
                                            targetId: link.id,
                                        });
                                    }}
                                    onDoubleClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingLinkId(link.id);
                                        setEditingLinkLabel(link.label || "");
                                    }}
                                />
                                {/* Visible glow when hovered */}
                                {isHovered && (
                                    <line
                                        x1={x1} y1={y1}
                                        x2={x2} y2={y2}
                                        stroke={isDark ? "rgba(200,200,200,0.3)" : "rgba(100,100,100,0.25)"}
                                        strokeWidth={6}
                                        strokeLinecap="round"
                                        className="graph-link__line"
                                    />
                                )}
                                {/* Visual line with arrows */}
                                <line
                                    className="graph-link__line"
                                    x1={x1} y1={y1}
                                    x2={x2} y2={y2}
                                    stroke={linkStyle.stroke}
                                    strokeWidth={linkStyle.strokeWidth}
                                    strokeDasharray={linkStyle.strokeDasharray}
                                    markerEnd={markerEnd}
                                    markerStart={markerStart}
                                />
                                {editingLinkId === link.id ? (() => {
                                    const inputW = Math.max(40, editingLinkLabel.length * 10 + 24);
                                    return (
                                        <foreignObject
                                            x={(sp.x + tp.x) / 2 - inputW / 2}
                                            y={(sp.y + tp.y) / 2 - 12}
                                            width={inputW}
                                            height={24}
                                            style={{ overflow: "visible" }}
                                        >
                                            <input
                                                value={editingLinkLabel}
                                                onChange={(e) => setEditingLinkLabel(e.target.value)}
                                                onBlur={() => {
                                                    setEditingLinkId(null);
                                                    if (editingLinkLabel !== (link.label || "")) {
                                                        updateLink(link.id, editingLinkLabel || null, link.direction, link.link_type, link.weight, link.sort_order);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.currentTarget.blur();
                                                    } else if (e.key === "Escape") {
                                                        setEditingLinkId(null);
                                                    }
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
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
                                                    fontFamily: "Inter, system-ui, sans-serif",
                                                    outline: "none",
                                                    padding: "0 6px",
                                                }}
                                            />
                                        </foreignObject>
                                    );
                                })() : link.label && (
                                    <text
                                        className="graph-link__line"
                                        x={(sp.x + tp.x) / 2}
                                        y={(sp.y + tp.y) / 2 + 4}
                                        textAnchor="middle"
                                        fill={isDark ? "rgba(156,163,175,0.6)" : "rgba(107,114,128,0.55)"}
                                        fontSize={11}
                                        fontFamily="Inter, system-ui, sans-serif"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {link.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                </svg>


                {nodes.map((node) => {
                    const pos = dragPos[node.id] ?? { x: node.x, y: node.y };
                    const showContents = expandedNodeIds.includes(node.id);
                    const isEditing = editingNodeId === node.id;

                    const rels = nodeContentRels.filter((r) => r.node_id === node.id);
                    const contentRels = rels
                        .map((r) => {
                            const content = contents.find((c) => c.id === r.content_id);
                            return content ? { ...content, rel_x: r.rel_x, rel_y: r.rel_y } : null;
                        })
                        .filter(Boolean) as { id: string; content_type: string; value_text: string | null; config: string | null; rel_x: number; rel_y: number }[];

                    return (
                        <GraphNode
                            key={node.id}
                            node={node}
                            pos={pos}
                            isEditing={isEditing}
                            isLinkSource={linkSourceId === node.id}
                            showContents={showContents}
                            contentRels={contentRels}
                            propDragPos={propDragPos}
                            onMouseDown={onNodeMouseDown}
                            onContextMenu={onNodeContextMenu}
                            onToggleContents={(id) => setNodeExpanded(id, !showContents)}
                            onRename={renameNode}
                            onCancelRename={cancelRename}
                            onPropMouseDown={(e, propId, nodeId, finalPos, areaCenterX, areaCenterY) => {
                                propDragState.current = {
                                    isPending: true,
                                    isDragging: false,
                                    propId,
                                    nodeId,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    startPosX: finalPos.x,
                                    startPosY: finalPos.y,
                                    areaCenterX,
                                    areaCenterY,
                                    startTime: Date.now(),
                                };
                            }}
                            onPropContextMenu={(e, propId, nodeId) => {
                                openContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    worldX: 0,
                                    worldY: 0,
                                    type: "content",
                                    targetId: propId,
                                    parentNodeId: nodeId,
                                });
                            }}
                            onPropDoubleClick={(propId) => openEditContentDialog(propId)}
                        />
                    );
                })}
            </div>

            {/* Context menus */}
            <GraphContextMenus />
        </div >
    );
}
