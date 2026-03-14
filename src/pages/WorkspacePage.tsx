import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderOpen, Clock3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function WorkspacePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const { recentWorkspaces, chooseWorkspace, openWorkspace, error } = useWorkspaceStore();

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

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_32%)]" />
            <main className="relative z-10 flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-4xl rounded-[28px] border border-black/8 bg-card/70 p-8 shadow-2xl shadow-black/6 backdrop-blur-xl dark:border-white/10 dark:shadow-black/20">
                    <div className="mb-10 max-w-2xl">
                        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">{t("workspace.eyebrow")}</p>
                        <h1 className="text-4xl font-semibold tracking-tight">{t("workspace.title")}</h1>
                        <p className="mt-3 text-base text-muted-foreground">{t("workspace.description")}</p>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-3">
                        <Button size="lg" onClick={handleChooseWorkspace} disabled={submitting}>
                            <FolderOpen className="size-4" data-icon="inline-start" />
                            {t("workspace.choose")}
                        </Button>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="rounded-2xl border border-black/8 bg-background/70 p-4 dark:border-white/10">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Clock3 className="size-4" />
                            {t("workspace.recent")}
                        </div>

                        {recentWorkspaces.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                                {t("workspace.noRecent")}
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {recentWorkspaces.map((path) => (
                                    <button
                                        key={path}
                                        className="flex items-center justify-between rounded-xl border border-black/8 bg-card px-4 py-4 text-left transition hover:border-black/15 hover:bg-muted/40 dark:border-white/10 dark:hover:border-white/20"
                                        onClick={() => void handleOpenRecent(path)}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{path.split(/[\\/]/).at(-1) || path}</div>
                                            <div className="text-xs text-muted-foreground">{path}</div>
                                        </div>
                                        <ArrowRight className="size-4 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
