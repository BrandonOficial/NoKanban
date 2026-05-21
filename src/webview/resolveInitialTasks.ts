import type { Task } from "../types";

export interface WebviewPersistedState {
  workspaceKey?: string;
  tasks?: Task[];
}

/**
 * Na abertura da webview, o Memento do VS Code (servidor) é a fonte de verdade.
 * O getState() da webview só prevalece se tiver MAIS tarefas no mesmo workspace
 * (ex.: saveTasks ainda não concluiu antes de recarregar).
 */
export function resolveInitialTasks(
  serverTasks: Task[],
  localState: WebviewPersistedState | undefined,
  workspaceKey: string,
): { tasks: Task[]; shouldSyncToBackend: boolean } {
  const server = serverTasks ?? [];

  if (localState?.workspaceKey !== workspaceKey || !Array.isArray(localState.tasks)) {
    return { tasks: server, shouldSyncToBackend: false };
  }

  const local = localState.tasks;

  if (local.length > server.length) {
    return { tasks: local, shouldSyncToBackend: true };
  }

  return { tasks: server, shouldSyncToBackend: false };
}
