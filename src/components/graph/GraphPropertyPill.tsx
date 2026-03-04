import { useRef, useCallback } from "react";
import Markdown from "react-markdown";
import { themeLoader } from "@/services/themeLoader";
import { useThemeStore } from "@/stores/themeStore";
import { configService } from "@/services/configService";

interface GraphContentCardProps {
    propId: string;
    nodeId: string;
    contentType: string;
    valueText: string | null;
    pos: { x: number; y: number };
    areaCenterX: number;
    areaCenterY: number;
    contentConfig?: string | null;
    onMouseDown: (e: React.MouseEvent, propId: string, nodeId: string, finalPos: { x: number; y: number }, areaCenterX: number, areaCenterY: number) => void;
    onContextMenu: (e: React.MouseEvent, propId: string, nodeId: string) => void;
    onDoubleClick?: (propId: string) => void;
}

interface ContentSize {
    width?: number;
    height?: number;
}

export function GraphContentCard({
    propId,
    nodeId,
    contentType: _contentType,
    valueText,
    pos,
    areaCenterX,
    areaCenterY,
    contentConfig,
    onMouseDown,
    onContextMenu,
    onDoubleClick,
}: GraphContentCardProps) {
    const isDark = useThemeStore((s) => s.theme === "dark");
    const { css, textCss } = themeLoader.content(isDark, contentConfig);

    const display = valueText ?? "";

    // Parse saved size from config
    const cfg = configService.parse<ContentSize>(contentConfig ?? null);
    const savedWidth = cfg?.width;
    const savedHeight = cfg?.height;

    const cardRef = useRef<HTMLDivElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Save size to config on resize (debounced)
    const handleMouseUp = useCallback(() => {
        const el = cardRef.current;
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        // Only save if size was manually changed (different from auto)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            configService.patch("content", propId, contentConfig ?? null, {
                width: w,
                height: h,
            }).catch(console.error);
        }, 300);
    }, [propId, contentConfig]);

    const sizeStyle: React.CSSProperties = {};
    if (savedWidth) sizeStyle.width = savedWidth;
    if (savedHeight) sizeStyle.height = savedHeight;

    return (
        <div
            ref={cardRef}
            className="graph-content-card"
            style={{
                backgroundColor: css.backgroundColor,
                borderColor: css.borderColor,
                left: pos.x,
                top: pos.y,
                ...sizeStyle,
            }}
            onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                onMouseDown(e, propId, nodeId, pos, areaCenterX, areaCenterY);
            }}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, propId, nodeId);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick?.(propId);
            }}
        >
            {/* 内部渲染区域 */}
            <div
                className="graph-content-card__inner"
                style={{ backgroundColor: isDark ? "#27272a" : "#ffffff" }}
            >
                <div
                    className="graph-content-card__text"
                    style={textCss}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <Markdown>{display}</Markdown>
                </div>
            </div>
        </div>
    );
}
