import { useState, type ReactNode } from "react";
import { Settings, Palette, Info, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { CHANGELOG } from "@/config/changelog";
import "./SettingsDialog.css";

type SettingsTab = "general" | "appearance" | "about";

const TABS: { key: SettingsTab; label: string; icon: ReactNode }[] = [
    { key: "general", label: "通用", icon: <Settings className="settings-sidebar__lucide" /> },
    { key: "appearance", label: "外观", icon: <Palette className="settings-sidebar__lucide" /> },
    { key: "about", label: "关于", icon: <Info className="settings-sidebar__lucide" /> },
];

interface SettingsDialogProps {
    onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Sidebar */}
                <aside className={`settings-sidebar ${collapsed ? "settings-sidebar--collapsed" : ""}`}>
                    <div className="settings-sidebar__top">
                        {!collapsed && <h2 className="settings-sidebar__title">设置</h2>}
                        <button
                            className="settings-sidebar__toggle"
                            onClick={() => setCollapsed(!collapsed)}
                            title={collapsed ? "展开" : "收起"}
                        >
                            {collapsed
                                ? <PanelLeftOpen className="settings-sidebar__lucide" />
                                : <PanelLeftClose className="settings-sidebar__lucide" />
                            }
                        </button>
                    </div>
                    <nav className="settings-sidebar__nav">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={`settings-sidebar__item ${activeTab === tab.key ? "settings-sidebar__item--active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                                title={collapsed ? tab.label : undefined}
                            >
                                <span className="settings-sidebar__icon">{tab.icon}</span>
                                {!collapsed && <span>{tab.label}</span>}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <main className="settings-content">
                    <header className="settings-content__header">
                        <h3 className="settings-content__title">
                            {TABS.find((t) => t.key === activeTab)?.label}
                        </h3>
                        <button className="settings-content__close" onClick={onClose}>
                            <X className="settings-content__close-icon" />
                        </button>
                    </header>
                    <div className="settings-content__body">
                        {activeTab === "general" && <GeneralSettings />}
                        {activeTab === "appearance" && <AppearanceSettings />}
                        {activeTab === "about" && <AboutSettings />}
                    </div>
                </main>
            </div>
        </div>
    );
}

function GeneralSettings() {
    return (
        <div className="settings-section">
            <p className="settings-placeholder">通用设置开发中…</p>
        </div>
    );
}

function AppearanceSettings() {
    return (
        <div className="settings-section">
            <p className="settings-placeholder">外观设置开发中…</p>
        </div>
    );
}


import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

function AboutSettings() {
    const [isChecking, setIsChecking] = useState(false);

    const handleCheckUpdate = async () => {
        try {
            setIsChecking(true);
            const update = await check();
            if (update) {
                const yes = await ask(`发现新版本 v${update.version}！\n\n更新内容：\n${update.body || '无详细说明'}\n\n是否立即下载并重启安装？`, {
                    title: '发现新版本',
                    kind: 'info',
                    okLabel: '更新',
                    cancelLabel: '取消'
                });
                if (yes) {
                    await update.downloadAndInstall();
                    await relaunch();
                }
            } else {
                await message('当前已经是最新版本了', { title: '检查更新', kind: 'info' });
            }
        } catch (error) {
            console.error("Failed to check for updates:", error);
            await message(`检查更新失败: ${error}`, { title: '错误', kind: 'error' });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-about">
                <h4 className="settings-about__name">OpenNote</h4>
                <p className="settings-about__version">v{CHANGELOG[0].version} {CHANGELOG[0].tag}</p>
                <p className="settings-about__desc">
                    知识图谱笔记工具
                </p>
                <button
                    className="settings-about__update-btn"
                    onClick={handleCheckUpdate}
                    disabled={isChecking}
                >
                    {isChecking ? "检查中..." : "检查更新"}
                </button>
            </div>

            <div className="settings-timeline">
                <h4 className="settings-timeline__heading">更新时间线</h4>
                {CHANGELOG.map((release) => (
                    <div key={release.version} className="settings-timeline__item">
                        <div className="settings-timeline__dot" />
                        <div className="settings-timeline__content">
                            <div className="settings-timeline__header">
                                <span className="settings-timeline__version">
                                    v{release.version}
                                </span>
                                {release.tag && (
                                    <span className="settings-timeline__tag">{release.tag}</span>
                                )}
                                <span className="settings-timeline__date">{release.date}</span>
                            </div>
                            <ul className="settings-timeline__list">
                                {release.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
