import * as vscode from "vscode";
import type { Task } from "./types";

export function getSavedNotes(state: vscode.Memento): string {
  return state.get<string>("notepadContent", "");
}

export function getSavedTasks(state: vscode.Memento): Task[] {
  return state.get<Task[]>("todoList", []) ?? [];
}
