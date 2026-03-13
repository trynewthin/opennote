import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Lightbulb,
    Type,
    StickyNote,
    File,
    Image,
    Link as LinkIcon,
    HelpCircle,
} from "lucide-react";
import { displayText, isResourceNodeType } from "@/lib/nodeDisplay";
import { getNodeType } from "@/lib/nodeTypeRegistry";
import { loadNodeResourceMetadata } from "@/lib/nodeResourceCache";
import { themeLoader } from "@/services/themeLoader";
import { useThemeStore } from "@/stores/themeStore";
import { useGraphStore } from "@/stores/graphStore";
import type { Node, NodeResourceMetadata } from "@/types";

// ─── Icon map ───

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Lightbulb,
    Type,
    StickyNote,
    File,
    Image,
    Link: LinkIcon,
};

function NodeIcon({ iconName, size = 14 }: { iconName: string; size?: number }) {
    const Icon = ICON_MAP[iconName] ?? HelpCircle;
    return <Icon size={size} className="graph-node__icon" />;
}

// ─── Props ───

interface GraphNodeProps {
    node: Node;
    pos: { x: number; y: number };
    isEditing: boolean;
    isLinkSource?: boolean;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    onClick: (e: React.MouseEvent, nodeId: string) => void;
    onRename: (nodeId: string, content: string) => void;
    onCancelRename: () => void;
    onSizeChange?: (nodeId: string, w: number, h: number) => void;
    zIndex?: number;
}

// ─── Component ───

export function GraphNode({
    node,
    pos,
    isEditing,
    isLinkSource,
    onMouseDown,
    onContextMenu,
    onClick,
    onRename,
    onCancelRename,
    onSizeChange,
    zIndex = 1,
}: GraphNodeProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const projectPath = useGraphStore((state) => state.projectPath);

    // Report real DOM size via ResizeObserver
    const stableOnSizeChange = useCallback(
        (id: string, w: number, h: number) => onSizeChange?.(id, w, h),
        [onSizeChange],
    );
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) stableOnSizeChange(node.id, width, height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [node.id, stableOnSizeChange]);
    const isDark = useThemeStore((state) => state.theme === "dark");
    const descriptor = getNodeType(node.type);

    // Merge type-level theme overrides into the themeLoader chain
    const { css: nodeCss, textCss: nodeTextCss } = useMemo(() => {
        const typeOverrides = descriptor.defaultThemeOverrides;
        // Inject type overrides as the "between project & entity" layer by
        // serializing them into a synthetic config string for themeLoader
        const entityConfig = node.view_config;
        return themeLoader.node(isDark, entityConfig, null, typeOverrides);
    }, [isDark, node.view_config, descriptor]);

    const [metadata, setMetadata] = useState<NodeResourceMetadata | null>(null);

    useEffect(() => {
        let active = true;
        if (!isResourceNodeType(node.type)) {
            setMetadata(null);
            return () => { active = false; };
        }
        if (!projectPath) {
            setMetadata(null);
            return () => { active = false; };
        }
        loadNodeResourceMetadata(projectPath, node.id)
            .then((value) => { if (active) setMetadata(value); })
            .catch((error) => { if (active) console.error("Failed to load node resource metadata:", error); });
        return () => { active = false; };
    }, [node.id, node.type, projectPath]);

    const label = useMemo(() => displayText(node, metadata), [metadata, node]);

    // ─── Inline edit input ───
    const fitInputWidth = (input: HTMLInputElement) => {
        // Reset width to 0 so scrollWidth reflects actual content width
        input.style.width = "0";
        input.style.width = `${input.scrollWidth + 4}px`;
    };

    const editElement = (
        <input
            className="graph-node__input"
            style={{ ...nodeTextCss, boxSizing: "content-box" }}
            defaultValue={isResourceNodeType(node.type) ? label : node.content}
            autoFocus
            ref={(el) => { if (el) fitInputWidth(el); }}
            onMouseDown={(event) => event.stopPropagation()}
            onInput={(event) => fitInputWidth(event.target as HTMLInputElement)}
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
    );

    // ─── Render variant ───
    const renderVariant = descriptor.renderVariant;

    let content: React.ReactNode;
    if (isEditing) {
        content = editElement;
    } else if (renderVariant === "text") {
        // Minimal text-only style (concept nodes)
        content = (
            <span className="graph-node__label" style={nodeTextCss} title={node.content}>
                {label}
            </span>
        );
    } else if (renderVariant === "media-preview" && !isEditing) {
        // Image preview with fallback to card
        content = (
            <div className="graph-node__media">
                <img
                    className="graph-node__preview-img"
                    src={metadata?.resolved_path ?? node.content}
                    alt={label}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="graph-node__label graph-node__label--sub" style={nodeTextCss} title={node.content}>
                    {label}
                </span>
            </div>
        );
    } else {
        // Card style (text/note/file/url) — icon + label
        content = (
            <div className="graph-node__card-content">
                <NodeIcon iconName={descriptor.icon} size={14} />
                <span className="graph-node__label" style={nodeTextCss} title={node.content}>
                    {label}
                </span>
            </div>
        );
    }

    const variantClass = `graph-node--${renderVariant}`;

    return (
        <div
            ref={rootRef}
            data-node-id={node.id}
            data-node-type={node.type}
            className={`graph-node ${variantClass}${isLinkSource ? " graph-node--link-source" : ""}`}
            style={{ ...nodeCss, left: pos.x, top: pos.y, zIndex }}
            onMouseDown={(event) => onMouseDown(event, node.id)}
            onContextMenu={(event) => onContextMenu(event, node.id)}
            onClick={(event) => onClick(event, node.id)}
        >
            {content}
        </div>
    );
}
