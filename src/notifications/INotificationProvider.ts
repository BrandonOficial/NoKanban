import * as vscode from "vscode";
import type { Task } from "../types";

export interface INotificationProvider {
  /** Identificador único da plataforma (ex: 'discord', 'telegram') */
  readonly platformId: string;

  /** Sincroniza as tarefas com a plataforma */
  sync(tasks: Task[], force: boolean, state: vscode.Memento): Promise<void>;

  /** Envia uma mensagem direta (ping/status) para a plataforma */
  notifyRaw(message: string): Promise<void>;
}
