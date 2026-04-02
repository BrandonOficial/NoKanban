import * as vscode from "vscode";
import { getSavedTasks, hasTasksChanged, saveSyncState } from "./storage";
import { buildUnifiedSummary, type ChatFormatter } from "./messageBuilder";

// Formatadores centralizados (Strategy Pattern)
const discordFormatter: ChatFormatter = {
  bold: (t) => `**${t}**`,
  strike: (t) => `~~${t}~~`,
  italic: (t) => `*${t}*`,
  escape: (t) => t.replace(/[*_~`]/g, "\\$&"),
  quotePrefix: ">",
};

const telegramFormatter: ChatFormatter = {
  bold: (t) => `*${t}*`,
  strike: (t) => `~${t}~`,
  italic: (t) => `_${t}_`,
  escape: (t) => t, // Mantendo limpo para Markdown comum
  quotePrefix: "",
};

export class NotificationService {
  // HOT-RELOAD: Busca as variáveis diretamente no uso para nunca usar configurações antigas
  private getConfig(key: string): string {
    return vscode.workspace.getConfiguration("nokanban").get<string>(key) || "";
  }

  /** Comando Manual: Usado para enviar mensagens customizadas / ping geral */
  public async sendProjectStatus(message: string): Promise<void> {
    await Promise.all([this.notifyDiscordRaw(message), this.notifyTelegramRaw(message)]);
  }

  /**
   * DRY: Sincronismo inteligente para Discord
   */
  public async syncProjectToDiscord(state: vscode.Memento, force = false): Promise<void> {
    const webhookUrl = this.getConfig("discordWebhookUrl");
    if (!webhookUrl) return;

    const tasks = getSavedTasks(state);
    if (!force && !hasTasksChanged(state, "discord", tasks)) return;

    const message = buildUnifiedSummary(tasks, discordFormatter);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      if (response.ok) {
        await saveSyncState(state, "discord", tasks);
      }
    } catch (error) {
      console.error("NoKanban: Erro ao sincronizar com Discord", error);
    }
  }

  /**
   * DRY: Sincronismo inteligente para Telegram
   */
  public async syncProjectToTelegram(state: vscode.Memento, force = false): Promise<void> {
    const botToken = this.getConfig("telegramBotToken");
    const chatId = this.getConfig("telegramChatId");

    if (!botToken || !chatId) return;

    const tasks = getSavedTasks(state);
    if (!force && !hasTasksChanged(state, "telegram", tasks)) return;

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
        await saveSyncState(state, "telegram", tasks);
      }
    } catch (error) {
      console.error("NoKanban: Erro ao sincronizar com Telegram", error);
    }
  }

  private async notifyDiscordRaw(message: string): Promise<void> {
    const webhookUrl = this.getConfig("discordWebhookUrl");
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
    } catch (error) {
      console.error("NoKanban: Erro ao bater na API do Discord", error);
    }
  }

  private async notifyTelegramRaw(message: string): Promise<void> {
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
      console.error("NoKanban: Erro ao bater na API do Telegram", error);
    }
  }
}
