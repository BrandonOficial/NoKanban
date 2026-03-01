import * as vscode from "vscode";
import type { Task } from "./types";
import { getSavedTasks, hasTasksChanged, saveSyncState } from "./storage";
import { buildUnifiedSummary, type ChatFormatter } from "./messageBuilder";

const TELEGRAM_TOKEN_KEY = "nokanban.telegramBotToken";
const TELEGRAM_CHAT_ID_KEY = "nokanban.telegramChatId";

function getTelegramConfig() {
  const config = vscode.workspace.getConfiguration();
  return {
    botToken: config.get<string>(TELEGRAM_TOKEN_KEY),
    chatId: config.get<string>(TELEGRAM_CHAT_ID_KEY),
  };
}

// Passamos as "regras" do Telegram para o construtor unificado
const telegramFormatter: ChatFormatter = {
  bold: (text) => `<b>${text}</b>`,
  strike: (text) => `<s>${text}</s>`,
  italic: (text) => `<i>${text}</i>`,
  // Telegram em modo HTML precisa escapar caracteres especiais para não quebrar a API
  escape: (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  quotePrefix: "", // O Telegram fica visualmente mais limpo sem prefixo de citação
};

/**
 * Envia o resumo do projeto para o Telegram.
 * @param state Memento com o estado global.
 * @param silent Se 'true', não exibe pop-ups no VS Code (ideal para background sync).
 */
export async function syncProjectToTelegram(
  state: vscode.Memento,
  silent: boolean = false,
): Promise<void> {
  const { botToken, chatId } = getTelegramConfig();

  if (!botToken || !chatId || botToken.trim() === "" || chatId.trim() === "") {
    if (!silent) {
      const action = await vscode.window.showWarningMessage(
        "Telegram Bot Token ou Chat ID não configurados para este projeto.",
        "Abrir Configurações",
      );
      if (action === "Abrir Configurações") {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          "nokanban.telegram",
        );
      }
    }
    return;
  }

  const tasks = getSavedTasks(state);

  // Guard Clause Anti-Spam: Aborta se for automático e nada mudou
  if (silent && !hasTasksChanged(state, "telegram", tasks)) {
    return;
  }

  try {
    // MÁGICA AQUI: Usamos a nossa função unificada passando as regras do Telegram
    const content = buildUnifiedSummary(tasks, telegramFormatter);
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API Error: ${(errorData as any).description || response.status}`,
      );
    }

    // Sucesso! Atualiza o último estado conhecido
    await saveSyncState(state, "telegram", tasks);

    if (!silent) {
      vscode.window.showInformationMessage(
        "Resumo enviado para o Telegram com sucesso!",
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!silent) {
      vscode.window.showErrorMessage(`Erro ao enviar para Telegram: ${msg}`);
    } else {
      console.error(`NoKanban - Falha silenciosa no Telegram: ${msg}`);
    }
  }
}
