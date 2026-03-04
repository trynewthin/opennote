import { useState } from "react";
import type { Node } from "@/types";
import { GraphContentCard } from "./GraphPropertyPill";
import { themeLoader } from "@/services/themeLoader";
import { useThemeStore } from "@/stores/themeStore";
import { useGraphStore } from "@/stores/graphStore";

interface ContentWithRel {
    id: string;
    content_type: string;
    value_text: string | null;
    config: string | null;
    rel_x: number;
    rel_y: number;
}

interface GraphNodeProps {
    node: Node;
    pos: { x: number; y: number };
    isEditing: boolean;
    isLinkSource?: boolean;
    showContents: boolean;
    contentRels: ContentWithRel[];
    propDragPos: Record<string, { x: number; y: number }>;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    onToggleContents: (nodeId: string) => void;
    onRename: (nodeId: string, title: string) => void;
    onCancelRename: () => void;
    onPropMouseDown: (e: React.MouseEvent, propId: string, nodeId: string, finalPos: { x: number; y: number }, areaCenterX: number, areaCenterY: number) => void;
    onPropContextMenu: (e: React.MouseEvent, propId: string, nodeId: string) => void;
    onPropDoubleClick?: (propId: string) => void;
}

// Layout constants
const BASE_RADIUS = 110;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashCode(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
}

export function GraphNode({
    node,
    pos,
    isEditing,
    isLinkSource,
    showContents,
    contentRels,
    propDragPos,
    onMouseDown,
    onContextMenu,
    onToggleContents,
    onRename,
    onCancelRename,
    onPropMouseDown,
    onPropContextMenu,
    onPropDoubleClick,
}: GraphNodeProps) {
    const isDark = useThemeStore((s) => s.theme === "dark");
    const { openContextMenu } = useGraphStore();
    const { css: nodeCss, textCss: nodeTextCss } = themeLoader.node(isDark, node.config);
    const [hoveredContentId, setHoveredContentId] = useState<string | null>(null);

    // Title element (shared between both modes)
    const titleElement = isEditing ? (
        <input
            className="graph-node__input"
            style={nodeTextCss}
            defaultValue={node.title}
            size={Math.max(node.title.length, 2)}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    onRename(node.id, (e.target as HTMLInputElement).value.trim() || node.title);
                } else if (e.key === "Escape") {
                    onCancelRename();
                }
            }}
            onBlur={(e) => {
                onRename(node.id, e.target.value.trim() || node.title);
            }}
        />
    ) : (
        <span className="graph-node__label" style={nodeTextCss}>{node.title}</span>
    );

    // No contents to show → simple node panel
    if (!showContents || contentRels.length === 0) {
        return (
            <div
                data-node-id={node.id}
                className={`graph-node${isLinkSource ? ' graph-node--link-source' : ''}`}
                style={{ ...nodeCss, left: pos.x, top: pos.y }}
                onMouseDown={(e) => onMouseDown(e, node.id)}
                onContextMenu={(e) => onContextMenu(e, node.id)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onToggleContents(node.id);
                }}
            >
                {titleElement}
            </div>
        );
    }

    // With contents → area with SVG connectors + orbiting pills
    const { stroke, strokeWidth, curvature } = themeLoader.contentLink(isDark);
    const areaSize = (BASE_RADIUS + 170) * 2;
    const halfArea = areaSize / 2;

    const pillPositions = contentRels.map((c, i) => {
        if (c.rel_x !== 0 || c.rel_y !== 0) {
            return { x: halfArea + c.rel_x, y: halfArea + c.rel_y };
        }
        const angle = GOLDEN_ANGLE * i - Math.PI / 2;
        const jitter = ((hashCode(c.id) % 30) - 15);
        const r = BASE_RADIUS + jitter;
        return {
            x: halfArea + r * Math.cos(angle),
            y: halfArea + r * Math.sin(angle),
        };
    });

    return (
        <div
            data-node-id={node.id}
            className="graph-node-expanded"
            style={{
                left: pos.x - halfArea,
                top: pos.y - halfArea,
                width: areaSize,
                height: areaSize,
            }}
        >
            {/* SVG curved connecting lines */}
            <svg className="graph-node-expanded__svg" width={areaSize} height={areaSize}>
                {pillPositions.map((pp, i) => {
                    const contentId = contentRels[i].id;
                    const target = propDragPos[contentId] ?? pp;
                    const mx = (halfArea + target.x) / 2;
                    const my = (halfArea + target.y) / 2;
                    const dx = target.x - halfArea;
                    const dy = target.y - halfArea;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const cx = mx + (-dy / len) * curvature;
                    const cy = my + (dx / len) * curvature;
                    const pathD = `M ${halfArea} ${halfArea} Q ${cx} ${cy} ${target.x} ${target.y}`;
                    const isHovered = hoveredContentId === contentId;

                    return (
                        <g key={contentId} className="graph-link">
                            {/* Hit Area */}
                            <path
                                className="graph-link__hit"
                                d={pathD}
                                onMouseEnter={() => setHoveredContentId(contentId)}
                                onMouseLeave={() => setHoveredContentId(null)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        worldX: 0,
                                        worldY: 0,
                                        type: "link",
                                        targetId: contentId,
                                    });
                                }}
                            />
                            {/* Hover Glow */}
                            {isHovered && (
                                <path
                                    className="graph-link__line"
                                    d={pathD}
                                    fill="none"
                                    stroke={isDark ? "rgba(200,200,200,0.3)" : "rgba(100,100,100,0.25)"}
                                    strokeWidth={6}
                                />
                            )}
                            {/* Visual Line */}
                            <path
                                className="graph-link__line"
                                d={pathD}
                                fill="none"
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Center node title */}
            <div
                className={`graph-node-expanded__center graph-node${isLinkSource ? ' graph-node--link-source' : ''}`}
                style={{ ...nodeCss, left: halfArea, top: halfArea }}
                onMouseDown={(e) => onMouseDown(e, node.id)}
                onContextMenu={(e) => onContextMenu(e, node.id)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onToggleContents(node.id);
                }}
            >
                {titleElement}
            </div>

            {/* Content cards */}
            {pillPositions.map((pp, i) => {
                const c = contentRels[i];
                const finalPos = propDragPos[c.id] ?? pp;
                return (
                    <GraphContentCard
                        key={c.id}
                        propId={c.id}
                        nodeId={node.id}
                        contentType={c.content_type}
                        valueText={c.value_text}
                        pos={finalPos}
                        areaCenterX={halfArea}
                        areaCenterY={halfArea}
                        contentConfig={c.config}
                        onMouseDown={onPropMouseDown}
                        onContextMenu={onPropContextMenu}
                        onDoubleClick={onPropDoubleClick}
                    />
                );
            })}
        </div>
    );
}
