import * as vscode from "vscode";
import type { Task } from "./types";
import { exportData, importData, type NotifyView } from "./exportImport";
import { authenticateGitHub, disconnectGist, pushToGist, pullFromGist } from "./gistSync";
import { enableAutoBackup } from "./autoBackup";
import type { NotificationService } from "./NotificationService";
import type { BackupScheduler } from "./BackupScheduler";

// Tipagem rigorosa para acabar com o "data: any"
export interface WebviewMessage {
  command: string;
  [key: string]: any;
}

export class WebviewMessageController {
  constructor(
    private readonly globalState: vscode.Memento,
    private readonly taskState: vscode.Memento,
    private readonly notificationService: NotificationService,
    private readonly backupScheduler: BackupScheduler,
    private readonly notifyView: NotifyView,
    private readonly onTasksUpdated: (tasks: Task[]) => void,
  ) {}

  public async handleMessage(data: WebviewMessage): Promise<void> {
    switch (data.command) {
      case "saveConfig":
        await this.handleSaveConfig(data);
        break;
      case "saveTasks":
        await this.handleSaveTasks(data.tasks);
        break;
      case "pushDiscord":
        await this.notificationService.syncSpecific("discord", this.taskState, true);
        vscode.window.showInformationMessage("Enviado para o Discord!");
        break;
      case "pushTelegram":
        await this.notificationService.syncSpecific("telegram", this.taskState, true);
        vscode.window.showInformationMessage("Enviado para o Telegram!");
        break;
      case "enableAutoBackup":
        await enableAutoBackup(this.globalState, data.enabled, data.interval, () =>
          this.backupScheduler.schedule(),
        );
        break;
      // ... Os outros cases (export, import, pushGist) seguem a mesma lógica de delegação
    }
  }

  private async handleSaveTasks(tasks: Task[] | undefined): Promise<void> {
    if (!Array.isArray(tasks)) {
      console.warn("NoKanban: saveTasks ignorado — payload inválido");
      return;
    }
    try {
      await this.taskState.update("todoList", tasks);
      this.onTasksUpdated(tasks);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("NoKanban: falha ao gravar tarefas", msg);
      vscode.window.showErrorMessage(`NoKanban: não foi possível guardar as tarefas. ${msg}`);
    }
  }

  private async handleSaveConfig(data: WebviewMessage): Promise<void> {
    try {
      const configToUpdate = vscode.workspace.getConfiguration();
      const hasWorkspace =
        vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
      const target = hasWorkspace
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.Global;

      await configToUpdate.update("nokanban.discordWebhookUrl", data.discordUrl, target);
      await configToUpdate.update("nokanban.telegramBotToken", data.telegramToken, target);
      await configToUpdate.update("nokanban.telegramChatId", data.telegramChatId, target);

      vscode.window.showInformationMessage("Credenciais salvas com sucesso! 🚀");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Falha ao salvar credenciais: ${msg}`);
    }
  }
}
