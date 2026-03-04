import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";

/** 导出项目为 .on 文件（弹出保存对话框） */
export async function exportProjectOn(projectId: string, projectName: string): Promise<boolean> {
    const safeName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_");

    const filePath = await save({
        title: "导出项目",
        defaultPath: `${safeName}.on`,
        filters: [{ name: "OpenNote 项目", extensions: ["on"] }],
    });

    if (!filePath) return false;

    await invoke("export_project_on", { projectId, filePath });
    return true;
}

/** 导入 .on 文件（弹出打开对话框） */
export async function importProjectOn(): Promise<string | null> {
    const filePath = await open({
        title: "导入项目",
        multiple: false,
        filters: [{ name: "OpenNote 项目", extensions: ["on"] }],
    });

    if (!filePath) return null;

    const projectId = await invoke<string>("import_project_on", { filePath: filePath as string });
    return projectId;
}
