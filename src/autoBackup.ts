import * as vscode from "vscode";
import { TextEncoder } from "util";
import { getSavedTasks } from "./storage";

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

export function initializeAutoBackup(state: vscode.Memento, onScheduled: () => void): void {
  const enabled = state.get<boolean>("autoBackupEnabled", false);
  if (enabled) {
    onScheduled();
  }
}

// FIX: Recebendo a URI segura global (se não tiver workspace aberto)
async function getOrCreateBackupDirectory(globalStorageUri: vscode.Uri): Promise<vscode.Uri> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;

  const backupDir = workspaceFolder
    ? vscode.Uri.joinPath(workspaceFolder, BACKUP_DIR_NAME)
    : vscode.Uri.joinPath(globalStorageUri, BACKUP_DIR_NAME);

  try {
    await vscode.workspace.fs.stat(backupDir);
  } catch {
    await vscode.workspace.fs.createDirectory(backupDir);
  }

  return backupDir;
}

async function cleanupOldBackups(backupDir: vscode.Uri): Promise<void> {
  const files = await vscode.workspace.fs.readDirectory(backupDir);
  const backupFiles = files
    .filter(([name]) => name.startsWith("backup-") && name.endsWith(".json"))
    .sort()
    .reverse();

  if (backupFiles.length > MAX_BACKUPS) {
    const filesToDelete = backupFiles.slice(MAX_BACKUPS);
    for (const [name] of filesToDelete) {
      await vscode.workspace.fs.delete(vscode.Uri.joinPath(backupDir, name));
    }
  }
}

// FIX: A função agora exige o globalStorageUri
export async function performAutoBackup(
  state: vscode.Memento,
  globalStorageUri: vscode.Uri,
): Promise<void> {
  try {
    const tasks = getSavedTasks(state);

    // Clean Code: Guard Clause para evitar backups vazios atoa
    if (!tasks || tasks.length === 0) {
      return;
    }

    const backupDir = await getOrCreateBackupDirectory(globalStorageUri);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = vscode.Uri.joinPath(backupDir, `backup-${timestamp}.json`);

    const data = {
      version: "2.0",
      backedUpAt: new Date().toISOString(),
      tasks,
    };

    const content = new TextEncoder().encode(JSON.stringify(data, null, 2));
    await vscode.workspace.fs.writeFile(backupFile, content);

    await cleanupOldBackups(backupDir);
  } catch (error) {
    console.error("NoKanban - Erro ao executar o backup local:", error);
  }
}
