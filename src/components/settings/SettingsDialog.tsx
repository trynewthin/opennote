import { useState, type ReactNode } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { Settings, Palette, Info, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { CHANGELOG } from "@/config/changelog";
import "./SettingsDialog.css";

type SettingsTab = "general" | "appearance" | "about";

const TABS: { key: SettingsTab; label: string; icon: ReactNode }[] = [
    { key: "general", label: "General", icon: <Settings className="settings-sidebar__lucide" /> },
    { key: "appearance", label: "Appearance", icon: <Palette className="settings-sidebar__lucide" /> },
    { key: "about", label: "About", icon: <Info className="settings-sidebar__lucide" /> },
];

interface SettingsDialogProps {
    onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-dialog" onClick={(event) => event.stopPropagation()}>
                <aside className={`settings-sidebar ${collapsed ? "settings-sidebar--collapsed" : ""}`}>
                    <div className="settings-sidebar__top">
                        {!collapsed && <h2 className="settings-sidebar__title">Settings</h2>}
                        <button
                            className="settings-sidebar__toggle"
                            onClick={() => setCollapsed(!collapsed)}
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            {collapsed ? (
                                <PanelLeftOpen className="settings-sidebar__lucide" />
                            ) : (
                                <PanelLeftClose className="settings-sidebar__lucide" />
                            )}
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

                <main className="settings-content">
                    <header className="settings-content__header">
                        <h3 className="settings-content__title">{TABS.find((tab) => tab.key === activeTab)?.label}</h3>
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
            <p className="settings-placeholder">General settings are under construction.</p>
        </div>
    );
}

function AppearanceSettings() {
    return (
        <div className="settings-section">
            <p className="settings-placeholder">Appearance settings are under construction.</p>
        </div>
    );
}

function AboutSettings() {
    const [isChecking, setIsChecking] = useState(false);

    const handleCheckUpdate = async () => {
        try {
            setIsChecking(true);
            const update = await check();
            if (update) {
                const yes = await ask(
                    `Version v${update.version} is available.\n\nRelease notes:\n${update.body || "No release notes"}\n\nDownload and restart now?`,
                    {
                        title: "Update Available",
                        kind: "info",
                        okLabel: "Update",
                        cancelLabel: "Cancel",
                    },
                );
                if (yes) {
                    await update.downloadAndInstall();
                    await relaunch();
                }
            } else {
                await message("You are already on the latest version.", {
                    title: "Check for Updates",
                    kind: "info",
                });
            }
        } catch (error) {
            console.error("Failed to check for updates:", error);
            await message(`Failed to check for updates: ${error}`, {
                title: "Error",
                kind: "error",
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-about">
                <h4 className="settings-about__name">OpenNote</h4>
                <p className="settings-about__version">
                    v{CHANGELOG[0].version} {CHANGELOG[0].tag}
                </p>
                <p className="settings-about__desc">Knowledge graph note-taking desktop app</p>
                <button className="settings-about__update-btn" onClick={handleCheckUpdate} disabled={isChecking}>
                    {isChecking ? "Checking..." : "Check for Updates"}
                </button>
            </div>

            <div className="settings-timeline">
                <h4 className="settings-timeline__heading">Release Timeline</h4>
                {CHANGELOG.map((release) => (
                    <div key={release.version} className="settings-timeline__item">
                        <div className="settings-timeline__dot" />
                        <div className="settings-timeline__content">
                            <div className="settings-timeline__header">
                                <span className="settings-timeline__version">v{release.version}</span>
                                {release.tag && <span className="settings-timeline__tag">{release.tag}</span>}
                                <span className="settings-timeline__date">{release.date}</span>
                            </div>
                            <ul className="settings-timeline__list">
                                {release.items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
