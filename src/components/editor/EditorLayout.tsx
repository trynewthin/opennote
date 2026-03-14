import type { ReactNode } from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import "@/pages/editor.css";

export interface TabItem {
    path: string;
    label: string;
}

interface EditorLayoutProps {
    currentProjectPath: string | null;
    tabs: TabItem[];
    onTabSwitch: (path: string) => void;
    onTabClose: (path: string) => void;
    children: ReactNode;
}

export function EditorLayout({
    currentProjectPath,
    tabs,
    onTabSwitch,
    onTabClose,
    children,
}: EditorLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`editor-page${collapsed ? " editor-page--collapsed" : ""}`}>
            <Sidebar
                currentProjectPath={currentProjectPath}
                collapsed={collapsed}
                onCollapse={setCollapsed}
            />
            <main className="editor-page__main">
                {tabs.length > 0 && (
                    <div className="editor-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.path}
                                className={`editor-tabs__tab${tab.path === currentProjectPath ? " editor-tabs__tab--active" : ""}`}
                                onClick={() => onTabSwitch(tab.path)}
                            >
                                <span className="editor-tabs__tab-label">{tab.label}</span>
                                <span
                                    className="editor-tabs__tab-close"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onTabClose(tab.path);
                                    }}
                                >
                                    <X className="size-3" />
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
