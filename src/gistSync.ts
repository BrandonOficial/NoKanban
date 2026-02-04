import * as vscode from "vscode";
import { getSavedNotes, getSavedTasks } from "./storage";
import type { NotifyView } from "./exportImport";

const GITHUB_AUTH_PROVIDER = "github";
const GITHUB_SCOPES = ["gist"];
const GITHUB_API_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "NoKanban-VSCode-Extension",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

const GIST_FILENAME = "notepad-backup.json";

function authHeader(token: string): Record<string, string> {
  return {
    ...GITHUB_API_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

function parseApiError(response: Response, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const msg = (body as { message?: string }).message;
    if (typeof msg === "string") {
      return msg;
    }
  }
  if (response.status === 401) {
    return "Token inválido ou expirado. Tente conectar novamente.";
  }
  if (response.status === 404) {
    return "Gist não encontrado. Pode ter sido excluído.";
  }
  if (response.status === 403) {
    return "Sem permissão. Verifique se o token tem escopo 'gist'.";
  }
  if (response.status >= 500) {
    return "GitHub temporariamente indisponível. Tente em alguns minutos.";
  }
  return `Erro ${response.status}`;
}

export async function getGitHubToken(): Promise<string | null> {
  try {
    const session = await (vscode.authentication as any).getSession(
      GITHUB_AUTH_PROVIDER,
      GITHUB_SCOPES,
      { createIfNone: false },
    );
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function authenticateGitHub(): Promise<string | null> {
  try {
    const session = await (vscode.authentication as any).getSession(
      GITHUB_AUTH_PROVIDER,
      GITHUB_SCOPES,
      { createIfNone: true },
    );
    return session?.accessToken ?? null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Falha ao conectar com GitHub: ${msg}`);
    return null;
  }
}

export async function disconnectGist(
  state: vscode.Memento,
  notifyView?: NotifyView,
): Promise<void> {
  await state.update("gistId", undefined);
  await state.update("gistLastSyncAt", undefined);
  notifyView?.("updateAuthStatus", { authenticated: false, lastSyncAt: null });
  vscode.window.showInformationMessage("Desconectado do Gist.");
}

/** Busca o conteúdo atual do Gist (para pull). */
async function fetchGist(
  token: string,
  gistId: string,
): Promise<{ notes: string; tasks: unknown[] } | null> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "GET",
    headers: authHeader(token),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(parseApiError(response, body));
  }

  const gist = body as { files?: Record<string, { content?: string }> };
  const file = gist.files?.[GIST_FILENAME];
  if (!file?.content) {
    throw new Error("Arquivo do backup não encontrado no Gist.");
  }

  try {
    const data = JSON.parse(file.content) as {
      notes?: string;
      tasks?: unknown[];
    };
    return {
      notes: typeof data.notes === "string" ? data.notes : "",
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
    };
  } catch {
    throw new Error("Conteúdo do Gist inválido.");
  }
}

/** Envia dados locais para o Gist (push). */
async function putGist(
  token: string,
  gistId: string | undefined,
  data: Record<string, unknown>,
): Promise<string> {
  const payload = {
    description: "NoKanban Backup",
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(data, null, 2),
      },
    },
  } as Record<string, unknown>;

  if (gistId) {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(parseApiError(response, body));
    }
    return gistId;
  }

  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(parseApiError(response, body));
  }
  const gist = body as { id?: string };
  if (typeof gist.id !== "string") {
    throw new Error("Resposta inválida do GitHub.");
  }
  return gist.id;
}

export async function pushToGist(
  state: vscode.Memento,
  notifyView?: NotifyView,
): Promise<void> {
  let token = await getGitHubToken();
  if (!token) {
    const choice = await vscode.window.showWarningMessage(
      "Conecte-se ao GitHub para enviar seus dados.",
      "Conectar",
      "Cancelar",
    );
    if (choice !== "Conectar") {
      return;
    }
    token = await authenticateGitHub();
    if (!token) {
      return;
    }
    notifyView?.("updateAuthStatus", { authenticated: true });
  }

  const gistId = state.get<string>("gistId");
  const notes = getSavedNotes(state);
  const tasks = getSavedTasks(state);
  const data = {
    version: "1.0",
    syncedAt: new Date().toISOString(),
    notes,
    tasks,
  };

  try {
    notifyView?.("syncStarted", {});
    const newOrExistingId = await putGist(token, gistId, data);
    if (!gistId) {
      await state.update("gistId", newOrExistingId);
    }
    const lastSyncAt = Date.now();
    await state.update("gistLastSyncAt", lastSyncAt);
    notifyView?.("syncDone", { lastSyncAt });
    vscode.window.showInformationMessage("Dados enviados para o Gist.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notifyView?.("syncError", { message });
    vscode.window.showErrorMessage(`Falha ao enviar: ${message}`);
  }
}

export async function pullFromGist(
  state: vscode.Memento,
  updateBadge: (tasks: unknown[]) => void,
  notifyView?: NotifyView,
): Promise<void> {
  const token = await getGitHubToken();
  if (!token) {
    vscode.window.showWarningMessage("Conecte-se ao GitHub antes de buscar.");
    return;
  }

  const gistId = state.get<string>("gistId");
  if (!gistId) {
    vscode.window.showInformationMessage(
      "Nenhum Gist vinculado. Envie seus dados primeiro (Enviar para nuvem).",
    );
    return;
  }

  try {
    notifyView?.("syncStarted", {});
    const { notes, tasks } = await fetchGist(token, gistId);
    await state.update("notepadContent", notes);
    await state.update("todoList", tasks);
    updateBadge(tasks);
    const lastSyncAt = Date.now();
    await state.update("gistLastSyncAt", lastSyncAt);
    notifyView?.("updateNotes", { text: notes });
    notifyView?.("updateTasks", { tasks });
    notifyView?.("syncDone", { lastSyncAt });
    vscode.window.showInformationMessage("Dados buscados do Gist.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notifyView?.("syncError", { message });
    vscode.window.showErrorMessage(`Falha ao buscar: ${message}`);
  }
}
