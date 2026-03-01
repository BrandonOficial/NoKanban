import * as vscode from "vscode";
import type { Task } from "./types";

export function getSavedTasks(state: vscode.Memento): Task[] {
  return state.get<Task[]>("todoList", []) ?? [];
}

// Verifica se as tarefas mudaram desde o último sync
export function hasTasksChanged(
  state: vscode.Memento,
  platform: "discord" | "telegram",
  currentTasks: Task[],
): boolean {
  const lastState = state.get<string>(`lastSyncedState_${platform}`);
  const currentState = JSON.stringify(currentTasks);
  return lastState !== currentState;
}

// Salva o snapshot atual para comparar no futuro
export async function saveSyncState(
  state: vscode.Memento,
  platform: "discord" | "telegram",
  tasks: Task[],
): Promise<void> {
  const currentState = JSON.stringify(tasks);
  await state.update(`lastSyncedState_${platform}`, currentState);
}
