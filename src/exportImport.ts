import * as vscode from "vscode";
import { TextEncoder, TextDecoder } from "util";
import type { Task } from "./types";
import { getSavedTasks } from "./storage";

export function generateExportContent(tasks: Task[]): string {
  const date = new Date().toLocaleDateString("pt-BR");
  let content = `=== NOTEPAD PRO - ${date} ===\n\n`;
  content += `--- TAREFAS ---\n`;

  if (!tasks?.length) {
    content += `(Nenhuma tarefa)\n`;
  } else {
    tasks.forEach((t) => {
      const priority = t.priority ? `[${t.priority.toUpperCase()}] ` : "";
      content += `[${t.done ? "x" : " "}] ${priority}${t.text}\n`;

      // Adicionando a nota da tarefa na exportação de texto
      if (t.note && t.note.trim() !== "") {
        content += `    📝 Nota: ${t.note.replace(/\n/g, "\n      ")}\n`;
      }

      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach((st) => {
          content += `    - [${st.done ? "x" : " "}] ${st.text}\n`;
        });
      }
    });
  }

  return content;
}

export type NotifyView = (command: string, data?: Record<string, unknown>) => void;

export async function exportData(state: vscode.Memento, notifyView?: NotifyView): Promise<void> {
  const tasks = getSavedTasks(state);

  const uri = await vscode.window.showSaveDialog({
    saveLabel: "Exportar",
    filters: {
      "Todos os formatos": ["txt", "md", "json"],
      Markdown: ["md"],
      Texto: ["txt"],
      JSON: ["json"],
    },
  });

  if (!uri) {
    return;
  }

  const fileName = uri.fsPath.toLowerCase();
  let content: string;
  let message: string;

  if (fileName.endsWith(".json")) {
    const data = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      tasks,
    };
    content = JSON.stringify(data, null, 2);
    message = "JSON exportado com sucesso!";
  } else {
    content = generateExportContent(tasks);
    message = "Salvo com sucesso!";
  }

  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
  vscode.window.showInformationMessage(message);
}

export async function importData(
  state: vscode.Memento,
  updateBadge: (tasks: Task[]) => void,
  notifyView?: NotifyView,
): Promise<void> {
  const options: vscode.OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Importar",
    filters: {
      "JSON (Recomendado)": ["json"],
    },
  };

  const fileUri = await vscode.window.showOpenDialog(options);

  if (!fileUri?.[0]) {
    return;
  }

  try {
    const fileData = await vscode.workspace.fs.readFile(fileUri[0]);
    const fileContent = new TextDecoder().decode(fileData);
    const fileName = fileUri[0].fsPath.toLowerCase();

    if (fileName.endsWith(".json")) {
      try {
        const data = JSON.parse(fileContent);
        if (data.tasks !== undefined) {
          await state.update("todoList", data.tasks || []);
          updateBadge(data.tasks || []);
        }
        notifyView?.("updateTasks", { tasks: data.tasks || [] });
        vscode.window.showInformationMessage("Tarefas importadas com sucesso!");
      } catch {
        vscode.window.showErrorMessage("Erro ao importar JSON. Verifique se o arquivo é válido.");
      }
    }
  } catch {
    vscode.window.showErrorMessage("Erro ao ler arquivo.");
  }
}
