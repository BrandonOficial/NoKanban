import * as vscode from "vscode";
import type { Task } from "./types";
import { getSavedTasks } from "./storage";
import { exportData, importData, type NotifyView } from "./exportImport";
import {
  getGitHubToken,
  authenticateGitHub,
  disconnectGist,
  pushToGist,
  pullFromGist,
} from "./gistSync";
import { enableAutoBackup, initializeAutoBackup, performAutoBackup } from "./autoBackup";
import { getWebviewContent } from "./webviewHtml";
import { NotificationService } from "./NotificationService";

export function activate(context: vscode.ExtensionContext) {
  // Injeção de dependência central do serviço
  const notificationService = new NotificationService();

  let sendReportCmd = vscode.commands.registerCommand("nokanban.sendReport", async () => {
    const message = "✅ *Status Report:* Mais uma task concluída no NoKanban! 🔥";
    await notificationService.sendProjectStatus(message);
    vscode.window.showInformationMessage("NoKanban: Status enviado para o time!");
  });

  const provider = new NotepadSidebarProvider(
    context.globalState,
    context.workspaceState,
    context.globalStorageUri,
    notificationService,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("notepad-sidebar", provider),
    vscode.commands.registerCommand("notepad.clear", () => provider.clearNotes()),
    sendReportCmd,
  );
}

class NotepadSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _autoBackupInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly _globalState: vscode.Memento,
    private readonly _workspaceState: vscode.Memento,
    private readonly _globalStorageUri: vscode.Uri,
    private readonly _notificationService: NotificationService,
  ) {
    initializeAutoBackup(this._globalState, () => this._scheduleBackup());
  }

  private get _taskState(): vscode.Memento {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return this._workspaceState;
    }
    return this._globalState;
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    await this._renderWebview();

    webviewView.webview.onDidReceiveMessage((data) => this._handleWebviewMessage(data));
  }

  private async _renderWebview(): Promise<void> {
    if (!this._view) {
      return;
    }

    const tasks = getSavedTasks(this._taskState);

    const autoBackupEnabled = this._globalState.get<boolean>("autoBackupEnabled", false);
    const autoBackupInterval = this._globalState.get<number>("autoBackupInterval", 30);
    const isAuthenticated = (await getGitHubToken()) !== null;

    const gistLastSyncAt = this._taskState.get<number | null>("gistLastSyncAt", null);

    const config = vscode.workspace.getConfiguration();
    const discordUrl = config.get<string>("nokanban.discordWebhookUrl", "");
    const telegramToken = config.get<string>("nokanban.telegramBotToken", "");
    const telegramChatId = config.get<string>("nokanban.telegramChatId", "");

    this._view.webview.html = getWebviewContent({
      webview: this._view.webview,
      tasks,
      autoBackupEnabled,
      autoBackupInterval,
      isAuthenticated,
      gistLastSyncAt,
      discordUrl,
      telegramToken,
      telegramChatId,
    });

    this._updateBadge(tasks);
  }

  private _scheduleBackup(): void {
    if (this._autoBackupInterval) {
      clearInterval(this._autoBackupInterval);
      this._autoBackupInterval = undefined;
    }

    const enabled = this._globalState.get<boolean>("autoBackupEnabled", false);
    if (!enabled) {
      return;
    }

    const intervalMinutes = this._globalState.get<number>("autoBackupInterval", 30);

    this._autoBackupInterval = setInterval(
      () => this._runBackgroundSyncs(),
      intervalMinutes * 60 * 1000,
    );
  }

  private async _runBackgroundSyncs(): Promise<void> {
    try {
      // Passando a URI segura injetada
      await performAutoBackup(this._taskState, this._globalStorageUri);

      const hasGitHubToken = (await getGitHubToken()) !== null;
      if (hasGitHubToken) {
        await pushToGist(this._taskState, undefined, true);
      }

      // Delegação robusta pro nosso Service unificado (Clean Code)
      await this._notificationService.syncProjectToDiscord(this._taskState, true);
      await this._notificationService.syncProjectToTelegram(this._taskState, true);
    } catch (error) {
      console.error("NoKanban: Falha no sincronismo em background", error);
    }
  }

  private async _handleWebviewMessage(data: any): Promise<void> {
    const notifyView: NotifyView = (cmd, d) => this._notifyView(cmd, d as Record<string, unknown>);

    switch (data.command) {
      case "saveConfig":
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

          const scopeMsg = hasWorkspace ? "este projeto" : "o VS Code (Global)";
          vscode.window.showInformationMessage(
            `Credenciais salvas com sucesso para ${scopeMsg}! 🚀`,
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Falha ao salvar credenciais: ${msg}`);
        }
        break;
      case "saveTasks":
        await this._taskState.update("todoList", data.tasks);
        this._updateBadge(data.tasks);
        break;
      case "export":
        await exportData(this._taskState, notifyView);
        break;
      case "import":
        await importData(this._taskState, (tasks) => this._updateBadge(tasks), notifyView);
        break;
      case "pushGist":
        await pushToGist(this._taskState, notifyView);
        break;
      case "pullGist":
        await pullFromGist(
          this._taskState,
          (tasks) => this._updateBadge(tasks as Task[]),
          notifyView,
        );
        break;
      case "authenticateGist":
        await this._handleGitHubAuth();
        break;
      case "disconnectGist":
        await disconnectGist(this._taskState, notifyView);
        break;
      case "enableAutoBackup":
        await enableAutoBackup(this._globalState, data.enabled, data.interval, () =>
          this._scheduleBackup(),
        );
        break;
      case "pushDiscord":
        // Força = true porque o comando foi clicado na mão
        await this._notificationService.syncProjectToDiscord(this._taskState, true);
        vscode.window.showInformationMessage("Enviado para o Discord!");
        break;
      case "pushTelegram":
        await this._notificationService.syncProjectToTelegram(this._taskState, true);
        vscode.window.showInformationMessage("Enviado para o Telegram!");
        break;
      case "notify":
        vscode.window.showInformationMessage(data.text);
        break;
    }
  }

  private async _handleGitHubAuth(): Promise<void> {
    const token = await authenticateGitHub();
    if (token) {
      vscode.window.showInformationMessage("Conectado ao GitHub com sucesso!");
      this._notifyView("updateAuthStatus", {
        authenticated: true,
        lastSyncAt: this._taskState.get<number | null>("gistLastSyncAt", null),
      });
    }
  }

  public clearNotes(): void {
    this._taskState.update("todoList", []);
    this._taskState.update("notepadContent", undefined);

    if (this._view) {
      this._view.badge = undefined;
      this._view.webview.postMessage({ command: "clearAll" });
    }
  }

  private _updateBadge(tasks: Task[]): void {
    if (!this._view || !Array.isArray(tasks)) {
      return;
    }

    const validTasks = tasks.filter((t) => t?.text?.trim());
    const pendingCount = validTasks.filter((t) => !t.done).length;

    this._view.badge =
      pendingCount > 0
        ? { tooltip: `${pendingCount} tarefa(s) pendente(s)`, value: pendingCount }
        : undefined;
  }

  private _notifyView(command: string, data?: Record<string, unknown>): void {
    this._view?.webview.postMessage({ command, ...data });
  }
}
