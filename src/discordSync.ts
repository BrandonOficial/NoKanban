import * as vscode from "vscode";
import type { Task } from "./types";
import { getSavedTasks, hasTasksChanged, saveSyncState } from "./storage";
import { buildUnifiedSummary, type ChatFormatter } from "./messageBuilder";

// Chave que definimos no package.json
const DISCORD_WEBHOOK_CONFIG_KEY = "nokanban.discordWebhookUrl";

function getWorkspaceWebhookUrl(): string | undefined {
  const config = vscode.workspace.getConfiguration();
  return config.get<string>(DISCORD_WEBHOOK_CONFIG_KEY);
}

// Passamos apenas as "regras" do Discord para o construtor unificado
const discordFormatter: ChatFormatter = {
  bold: (text) => `**${text}**`,
  strike: (text) => `~~${text}~~`,
  italic: (text) => `*${text}*`,
  escape: (text) => text, // Discord não precisa escapar HTML
  quotePrefix: "> ",
};

/**
 * Envia o resumo do projeto para o Discord.
 * @param state Memento com o estado global.
 * @param silent Se 'true', não exibe pop-ups no VS Code (ideal para background sync).
 */
export async function syncProjectToDiscord(
  state: vscode.Memento,
  silent: boolean = false,
): Promise<void> {
  const webhookUrl = getWorkspaceWebhookUrl();

  if (!webhookUrl || webhookUrl.trim() === "") {
    if (!silent) {
      const action = await vscode.window.showWarningMessage(
        "Webhook do Discord não configurado para este projeto.",
        "Abrir Configurações",
      );
      if (action === "Abrir Configurações") {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          "nokanban.discordWebhookUrl",
        );
      }
    }
    return;
  }

  const tasks = getSavedTasks(state);

  // Guard Clause Anti-Spam: Aborta se for automático e nada mudou
  if (silent && !hasTasksChanged(state, "discord", tasks)) {
    return;
  }

  try {
    // MÁGICA AQUI: Usamos a nossa função unificada passando as regras do Discord
    const content = buildUnifiedSummary(tasks, discordFormatter);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Status HTTP ${response.status}`);
    }

    // Sucesso! Atualiza o último estado conhecido
    await saveSyncState(state, "discord", tasks);

    if (!silent) {
      vscode.window.showInformationMessage(
        "Resumo enviado para o Discord com sucesso!",
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!silent) {
      vscode.window.showErrorMessage(`Erro ao enviar para Discord: ${msg}`);
    } else {
      console.error(`NoKanban - Falha silenciosa no sync do Discord: ${msg}`);
    }
  }
}
