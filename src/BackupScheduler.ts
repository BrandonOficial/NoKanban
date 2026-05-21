import * as vscode from "vscode";
import { performAutoBackup } from "./autoBackup";
import { pushToGist, getGitHubToken } from "./gistSync";
import type { NotificationService } from "./NotificationService";

export class BackupScheduler {
  private _autoBackupInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly globalState: vscode.Memento,
    private readonly taskState: vscode.Memento,
    private readonly globalStorageUri: vscode.Uri,
    private readonly notificationService: NotificationService,
  ) {}

  public schedule(): void {
    if (this._autoBackupInterval) {
      clearInterval(this._autoBackupInterval);
      this._autoBackupInterval = undefined;
    }

    const enabled = this.globalState.get<boolean>("autoBackupEnabled", false);
    if (!enabled) return;

    const intervalMinutes = this.globalState.get<number>("autoBackupInterval", 30);

    this._autoBackupInterval = setInterval(
      () => this.runBackgroundSyncs(),
      intervalMinutes * 60 * 1000,
    );
  }

  private async runBackgroundSyncs(): Promise<void> {
    try {
      await performAutoBackup(this.taskState, this.globalStorageUri);

      const hasGitHubToken = (await getGitHubToken()) !== null;
      if (hasGitHubToken) {
        await pushToGist(this.taskState, undefined, true);
      }

      // Olha a beleza da Injeção de Dependência aqui!
      // Sincroniza todas as plataformas registradas sem saber quais são.
      await this.notificationService.syncAll(this.taskState, true);
    } catch (error) {
      console.error("NoKanban: Falha no sincronismo em background", error);
    }
  }
}
