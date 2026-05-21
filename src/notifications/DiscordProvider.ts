import * as vscode from "vscode";
import type { Task } from "../types";
import { hasTasksChanged, saveSyncState } from "../storage";
import { buildUnifiedSummary, type ChatFormatter } from "../messageBuilder";
import type { INotificationProvider } from "./INotificationProvider";

const discordFormatter: ChatFormatter = {
  bold: (t) => `**${t}**`,
  strike: (t) => `~~${t}~~`,
  italic: (t) => `*${t}*`,
  escape: (t) => t.replace(/[*_~`]/g, "\\$&"),
  quotePrefix: ">",
};

export class DiscordProvider implements INotificationProvider {
  public readonly platformId = "discord";

  // HOT-RELOAD encapsulado onde realmente é usado
  private getConfig(key: string): string {
    return vscode.workspace.getConfiguration("nokanban").get<string>(key) || "";
  }

  public async sync(tasks: Task[], force: boolean, state: vscode.Memento): Promise<void> {
    const webhookUrl = this.getConfig("discordWebhookUrl");
    if (!webhookUrl) return;

    if (!force && !hasTasksChanged(state, this.platformId, tasks)) return;

    const message = buildUnifiedSummary(tasks, discordFormatter);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });

      if (response.ok) {
        await saveSyncState(state, this.platformId, tasks);
      }
    } catch (error) {
      console.error(`NoKanban: Erro ao sincronizar com ${this.platformId}`, error);
    }
  }

  public async notifyRaw(message: string): Promise<void> {
    const webhookUrl = this.getConfig("discordWebhookUrl");
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
    } catch (error) {
      console.error(`NoKanban: Erro ao bater na API do ${this.platformId}`, error);
    }
  }
}
