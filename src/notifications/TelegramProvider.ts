import * as vscode from "vscode";
import type { Task } from "../types";
import { hasTasksChanged, saveSyncState } from "../storage";
import { buildUnifiedSummary, type ChatFormatter } from "../messageBuilder";
import type { INotificationProvider } from "./INotificationProvider";

const telegramFormatter: ChatFormatter = {
  bold: (t) => `*${t}*`,
  strike: (t) => `~${t}~`,
  italic: (t) => `_${t}_`,
  escape: (t) => t, // Limpo para Markdown comum
  quotePrefix: "",
};

export class TelegramProvider implements INotificationProvider {
  public readonly platformId = "telegram";

  private getConfig(key: string): string {
    return vscode.workspace.getConfiguration("nokanban").get<string>(key) || "";
  }

  public async sync(tasks: Task[], force: boolean, state: vscode.Memento): Promise<void> {
    const botToken = this.getConfig("telegramBotToken");
    const chatId = this.getConfig("telegramChatId");

    if (!botToken || !chatId) return;
    if (!force && !hasTasksChanged(state, this.platformId, tasks)) return;

    const message = buildUnifiedSummary(tasks, telegramFormatter);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      if (response.ok) {
        await saveSyncState(state, this.platformId, tasks);
      }
    } catch (error) {
      console.error(`NoKanban: Erro ao sincronizar com ${this.platformId}`, error);
    }
  }

  public async notifyRaw(message: string): Promise<void> {
    const botToken = this.getConfig("telegramBotToken");
    const chatId = this.getConfig("telegramChatId");
    if (!botToken || !chatId) return;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    } catch (error) {
      console.error(`NoKanban: Erro ao bater na API do ${this.platformId}`, error);
    }
  }
}
