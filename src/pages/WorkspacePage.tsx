import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderOpen, MoreHorizontal, Trash2, Settings, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

export function WorkspacePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [pendingRemovePath, setPendingRemovePath] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const titleRef = useRef<HTMLDivElement>(null);
    const outerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = titleRef.current;
        const container = outerContainerRef.current;
        if (!el || !container) return;

        const fit = () => {
            const maxWidth = container.getBoundingClientRect().width;
            let lo = 1, hi = 800;
            while (hi - lo > 0.5) {
                const mid = (lo + hi) / 2;
                el.style.fontSize = `${mid}px`;
                if (el.getBoundingClientRect().width <= maxWidth) lo = mid;
                else hi = mid;
            }
            el.style.fontSize = `${lo}px`;
        };

        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(container);
        return () => ro.disconnect();
    }, []);
    const { recentWorkspaces, chooseWorkspace, openWorkspace, removeRecentWorkspace, error } = useWorkspaceStore();

    const handleChooseWorkspace = async () => {
        setSubmitting(true);
        try {
            const selected = await chooseWorkspace();
            if (selected) {
                navigate("/editor");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenRecent = async (path: string) => {
        setSubmitting(true);
        try {
            await openWorkspace(path);
            navigate("/editor");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveRecent = async () => {
        if (!pendingRemovePath) return;
        setSubmitting(true);
        try {
            await removeRecentWorkspace(pendingRemovePath);
            setPendingRemovePath(null);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
        <div className="min-h-screen overflow-y-auto bg-background">
            <div className="absolute top-6 right-6 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
                    {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)}>
                    <Settings className="size-5" />
                </Button>
            </div>
            <main className="flex min-h-screen justify-center px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
                <div ref={outerContainerRef} className="grid w-full max-w-2xl grid-rows-[auto_1fr] gap-14">
                    <div className="flex w-full items-end text-left">
                        <div ref={titleRef} className="whitespace-nowrap leading-[0.85] font-semibold tracking-[-0.11em] text-foreground">
                            OpenNote
                        </div>
                    </div>
                    <div className="grid w-full grid-rows-[auto_auto_1fr] gap-10">
                        <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-4">
                            <div className="text-left">
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("workspace.title")}</h1>
                            </div>
                            <Button size="lg" onClick={handleChooseWorkspace} disabled={submitting}>
                                <FolderOpen className="size-4" data-icon="inline-start" />
                                {t("workspace.choose")}
                            </Button>
                        </div>

                        {error && (
                            <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <section className="flex w-full flex-col gap-4">
                            {recentWorkspaces.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                                    {t("workspace.noRecent")}
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {recentWorkspaces.map((path) => (
                                        <div
                                            key={path}
                                            className="flex items-center gap-2 rounded-2xl border border-black/8 px-2 py-2 transition hover:border-black/15 hover:bg-muted/40 dark:border-white/10 dark:hover:border-white/20"
                                        >
                                            <button
                                                className="flex min-w-0 flex-1 items-center px-2 py-2 text-left"
                                                onClick={() => void handleOpenRecent(path)}
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{path.split(/[\\/]/).at(-1) || path}</div>
                                                    <div className="truncate text-xs text-muted-foreground">{path}</div>
                                                </div>
                                            </button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="mr-2"
                                                            onClick={(event) => event.stopPropagation()}
                                                        />
                                                    }
                                                >
                                                    <MoreHorizontal className="size-3.5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" side="bottom" sideOffset={6}>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setPendingRemovePath(path);
                                                        }}
                                                    >
                                                        <Trash2 />
                                                        {t("workspace.removeRecent")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
        <AlertDialog open={!!pendingRemovePath} onOpenChange={(open) => !open && setPendingRemovePath(null)}>
            <AlertDialogContent size="sm" onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("workspace.removeRecentTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("workspace.removeRecentDesc")}
                        <span className="mt-1 block break-all font-medium text-foreground/80">
                            {pendingRemovePath}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleRemoveRecent}
                        disabled={submitting}
                    >
                        {t("workspace.removeRecentConfirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
        </>
    );
}
