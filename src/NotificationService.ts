import * as vscode from "vscode";
import { getSavedTasks } from "./storage";
import type { INotificationProvider } from "./notifications/INotificationProvider";

export class NotificationService {
  private providers: INotificationProvider[];

  // Injeção de dependência via construtor
  constructor(providers: INotificationProvider[]) {
    this.providers = providers;
  }

  /** Comando Manual: Usado para enviar mensagens customizadas / ping geral */
  public async sendProjectStatus(message: string): Promise<void> {
    const notifyPromises = this.providers.map((provider) => provider.notifyRaw(message));

    // allSettled garante que a falha de um não interrompa o outro
    await Promise.allSettled(notifyPromises);
  }

  /**
   * Sincroniza todas as plataformas registradas simultaneamente.
   * Fechado para modificação (OCP) - novos provedores não alteram este método.
   */
  public async syncAll(state: vscode.Memento, force = false): Promise<void> {
    const tasks = getSavedTasks(state);

    const syncPromises = this.providers.map((provider) => provider.sync(tasks, force, state));

    await Promise.allSettled(syncPromises);
  }

  /**
   * Sincroniza apenas uma plataforma específica (útil para os botões manuais da UI)
   */
  public async syncSpecific(
    platformId: string,
    state: vscode.Memento,
    force = false,
  ): Promise<void> {
    const provider = this.providers.find((p) => p.platformId === platformId);
    if (!provider) {
      console.warn(`NoKanban: Provedor de notificação não encontrado: ${platformId}`);
      return;
    }

    const tasks = getSavedTasks(state);
    await provider.sync(tasks, force, state);
  }
}
