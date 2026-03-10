import { useEffect, useMemo, useState } from "react";
import { displayText, isResourceNodeType } from "@/lib/nodeDisplay";
import { loadNodeResourceMetadata } from "@/lib/nodeResourceCache";
import { themeLoader } from "@/services/themeLoader";
import { useThemeStore } from "@/stores/themeStore";
import type { Node, NodeResourceMetadata } from "@/types";

interface GraphNodeProps {
    node: Node;
    pos: { x: number; y: number };
    isEditing: boolean;
    isLinkSource?: boolean;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    onDoubleClick: (nodeId: string) => void;
    onRename: (nodeId: string, content: string) => void;
    onCancelRename: () => void;
}

export function GraphNode({
    node,
    pos,
    isEditing,
    isLinkSource,
    onMouseDown,
    onContextMenu,
    onDoubleClick,
    onRename,
    onCancelRename,
}: GraphNodeProps) {
    const isDark = useThemeStore((state) => state.theme === "dark");
    const { css: nodeCss, textCss: nodeTextCss } = themeLoader.node(isDark, node.view_config);
    const [metadata, setMetadata] = useState<NodeResourceMetadata | null>(null);

    useEffect(() => {
        let active = true;
        if (!isResourceNodeType(node.node_type)) {
            setMetadata(null);
            return () => {
                active = false;
            };
        }

        loadNodeResourceMetadata(node.id)
            .then((value) => {
                if (active) setMetadata(value);
            })
            .catch((error) => {
                if (active) {
                    console.error("Failed to load node resource metadata:", error);
                }
            });

        return () => {
            active = false;
        };
    }, [node.id, node.node_type, node.content]);

    const label = useMemo(() => displayText(node, metadata), [metadata, node]);

    const titleElement = isEditing ? (
        <input
            className="graph-node__input"
            style={nodeTextCss}
            defaultValue={node.content}
            size={Math.max(label.length, 4)}
            autoFocus
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    onRename(node.id, (event.target as HTMLInputElement).value.trim() || node.content);
                } else if (event.key === "Escape") {
                    onCancelRename();
                }
            }}
            onBlur={(event) => {
                onRename(node.id, event.target.value.trim() || node.content);
            }}
        />
    ) : (
        <span className="graph-node__label" style={nodeTextCss} title={node.content}>
            {label}
        </span>
    );

    return (
        <div
            data-node-id={node.id}
            className={`graph-node${isLinkSource ? " graph-node--link-source" : ""}`}
            style={{ ...nodeCss, left: pos.x, top: pos.y }}
            onMouseDown={(event) => onMouseDown(event, node.id)}
            onContextMenu={(event) => onContextMenu(event, node.id)}
            onDoubleClick={(event) => {
                event.stopPropagation();
                onDoubleClick(node.id);
            }}
        >
            {titleElement}
        </div>
    );
}
