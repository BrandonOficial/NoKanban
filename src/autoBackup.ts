import * as vscode from "vscode";
import { TextEncoder } from "util";
import { getSavedNotes, getSavedTasks } from "./storage";

const BACKUP_DIR_NAME = ".nokanban-backups";
const MAX_BACKUPS = 10;

export async function enableAutoBackup(
  state: vscode.Memento,
  enabled: boolean,
  intervalMinutes: number,
  onScheduled: () => void,
): Promise<void> {
  await state.update("autoBackupEnabled", enabled);
  await state.update("autoBackupInterval", intervalMinutes);
  onScheduled();
}

export function initializeAutoBackup(
  state: vscode.Memento,
  onScheduled: () => void,
): void {
  const enabled = state.get<boolean>("autoBackupEnabled", false);
  if (enabled) {
    onScheduled();
  }
}

export async function performAutoBackup(state: vscode.Memento): Promise<void> {
  const notes = getSavedNotes(state);
  const tasks = getSavedTasks(state);
  const data = {
    version: "1.0",
    backedUpAt: new Date().toISOString(),
    notes,
    tasks,
  };

  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
    const backupDir = workspaceFolder
      ? vscode.Uri.joinPath(workspaceFolder, BACKUP_DIR_NAME)
      : vscode.Uri.joinPath(
          vscode.Uri.file(vscode.env.appRoot),
          BACKUP_DIR_NAME,
        );

    try {
      await vscode.workspace.fs.createDirectory(backupDir);
    } catch {
      // Diretório já existe
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = vscode.Uri.joinPath(
      backupDir,
      `backup-${timestamp}.json`,
    );

    await vscode.workspace.fs.writeFile(
      backupFile,
      new TextEncoder().encode(JSON.stringify(data, null, 2)),
    );

    const files = await vscode.workspace.fs.readDirectory(backupDir);
    const backupFiles = files
      .filter(([name]) => name.startsWith("backup-"))
      .sort()
      .reverse();

    if (backupFiles.length > MAX_BACKUPS) {
      for (const [name] of backupFiles.slice(MAX_BACKUPS)) {
        await vscode.workspace.fs.delete(vscode.Uri.joinPath(backupDir, name));
      }
    }
  } catch (error) {
    console.error("Erro no backup automático:", error);
  }
}
