import * as vscode from "vscode";
import { getSavedTasks, getWorkspaceKey } from "./storage";
import { getWebviewContent } from "./webviewHtml";
import type { WebviewMessageController, WebviewMessage } from "./WebviewMessageController";
import type { Task } from "./types";
import { getGitHubToken } from "./gistSync";

export class NotepadSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri, // <-- 1. Adiciona a URI da extensão aqui
    private readonly taskState: vscode.Memento,
    private readonly globalState: vscode.Memento,
    private readonly controllerFactory: (
      notifyView: any,
      updateBadge: any,
    ) => WebviewMessageController,
  ) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    await this.renderWebview();

    // Fabricamos o controller passando as funções de callback da UI
    const notifyView = (cmd: string, data?: any) =>
      this._view?.webview.postMessage({ command: cmd, ...data });
    const updateBadge = (tasks: Task[]) => this.updateBadge(tasks);

    const controller = this.controllerFactory(notifyView, updateBadge);

    webviewView.webview.onDidReceiveMessage((data: WebviewMessage) => {
      void controller.handleMessage(data);
    });
  }

  private async renderWebview(): Promise<void> {
    if (!this._view) return;

    const tasks = getSavedTasks(this.taskState);
    const config = vscode.workspace.getConfiguration();

    // ✔️ 2. Gera a URI AQUI DENTRO, onde a _view já existe de certeza!
    const scriptUri = this._view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.js"),
    );

    this._view.webview.html = getWebviewContent({
      webview: this._view.webview,
      scriptUri: scriptUri,
      workspaceKey: getWorkspaceKey(),
      tasks,
      autoBackupEnabled: this.globalState.get<boolean>("autoBackupEnabled", false),
      autoBackupInterval: this.globalState.get<number>("autoBackupInterval", 30),
      isAuthenticated: (await getGitHubToken()) !== null,
      gistLastSyncAt: this.taskState.get<number | null>("gistLastSyncAt", null),
      discordUrl: config.get<string>("nokanban.discordWebhookUrl", ""),
      telegramToken: config.get<string>("nokanban.telegramBotToken", ""),
      telegramChatId: config.get<string>("nokanban.telegramChatId", ""),
    });

    this.updateBadge(tasks);
  }

  public clearNotes(): void {
    this.taskState.update("todoList", []);
    this.taskState.update("notepadContent", undefined);

    if (this._view) {
      this._view.badge = undefined;
      this._view.webview.postMessage({ command: "clearAll" });
    }
  }

  private updateBadge(tasks: Task[]): void {
    if (!this._view || !Array.isArray(tasks)) return;

    const validTasks = tasks.filter((t) => t?.text?.trim());
    const pendingCount = validTasks.filter((t) => !t.done).length;

    this._view.badge =
      pendingCount > 0
        ? { tooltip: `${pendingCount} tarefa(s) pendente(s)`, value: pendingCount }
        : undefined;
  }
}
