import * as vscode from "vscode";

export class NotificationService {
  private discordWebhookUrl: string;
  private telegramBotToken: string;
  private telegramChatId: string;

  constructor() {
    // Injeção limpa das variáveis de ambiente configuradas no package.json
    const config = vscode.workspace.getConfiguration("nokanban");
    this.discordWebhookUrl = config.get<string>("discordWebhookUrl") || "";
    this.telegramBotToken = config.get<string>("telegramBotToken") || "";
    this.telegramChatId = config.get<string>("telegramChatId") || "";
  }

  /**
   * Método público e único ponto de entrada para enviar o status.
   * Dispara as requisições em paralelo usando Promise.all para não travar a thread.
   */
  public async sendProjectStatus(message: string): Promise<void> {
    await Promise.all([
      this.notifyDiscord(message),
      this.notifyTelegram(message),
    ]);
  }

  private async notifyDiscord(message: string): Promise<void> {
    // Fail-Fast: Se não tem URL, a gente aborta silenciosamente sem quebrar o fluxo
    if (!this.discordWebhookUrl) {
      console.warn("NoKanban: Discord Webhook URL não configurada.");
      return;
    }

    try {
      await fetch(this.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
    } catch (error) {
      console.error("NoKanban: Erro ao bater na API do Discord", error);
    }
  }

  private async notifyTelegram(message: string): Promise<void> {
    // Fail-Fast para o Telegram
    if (!this.telegramBotToken || !this.telegramChatId) {
      console.warn("NoKanban: Credenciais do Telegram ausentes.");
      return;
    }

    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: "Markdown", // Permite enviar texto formatado com negrito/itálico
        }),
      });
    } catch (error) {
      console.error("NoKanban: Erro ao bater na API do Telegram", error);
    }
  }
}
