import * as vscode from "vscode";
import { TextEncoder, TextDecoder } from "util";
import type { Task } from "./types";
import { getSavedNotes, getSavedTasks } from "./storage";

export function generateExportContent(notes: string, tasks: Task[]): string {
  const date = new Date().toLocaleDateString("pt-BR");
  let content = `=== NOTEPAD PRO - ${date} ===\n\n`;
  content += `--- NOTAS ---\n${notes || "(Vazio)"}\n\n`;
  content += `--- TAREFAS ---\n`;

  if (!tasks?.length) {
    content += `(Nenhuma tarefa)\n`;
  } else {
    tasks.forEach((t) => {
      const priority = t.priority ? `[${t.priority.toUpperCase()}] ` : "";
      content += `[${t.done ? "x" : " "}] ${priority}${t.text}\n`;
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach((st) => {
          content += `    - [${st.done ? "x" : " "}] ${st.text}\n`;
        });
      }
    });
  }

  return content;
}

export type NotifyView = (
  command: string,
  data?: Record<string, unknown>,
) => void;

export async function exportData(
  state: vscode.Memento,
  notifyView?: NotifyView,
): Promise<void> {
  const notes = getSavedNotes(state);
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

  if (!uri) return;

  const fileName = uri.fsPath.toLowerCase();
  let content: string;
  let message: string;

  if (fileName.endsWith(".json")) {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      notes,
      tasks,
    };
    content = JSON.stringify(data, null, 2);
    message = "JSON exportado com sucesso!";
  } else {
    content = generateExportContent(notes, tasks);
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
      "Todos os formatos": ["txt", "md", "json"],
      Markdown: ["md"],
      Texto: ["txt"],
      JSON: ["json"],
    },
  };

  const fileUri = await vscode.window.showOpenDialog(options);

  if (!fileUri?.[0]) return;

  try {
    const fileData = await vscode.workspace.fs.readFile(fileUri[0]);
    const fileContent = new TextDecoder().decode(fileData);
    const fileName = fileUri[0].fsPath.toLowerCase();

    if (fileName.endsWith(".json")) {
      try {
        const data = JSON.parse(fileContent);
        if (data.notes !== undefined) {
          await state.update("notepadContent", data.notes || "");
        }
        if (data.tasks !== undefined) {
          await state.update("todoList", data.tasks || []);
          updateBadge(data.tasks || []);
        }
        notifyView?.("updateNotes", { text: data.notes || "" });
        notifyView?.("updateTasks", { tasks: data.tasks || [] });
        vscode.window.showInformationMessage("JSON importado com sucesso!");
      } catch {
        vscode.window.showErrorMessage(
          "Erro ao importar JSON. Verifique se o arquivo é válido.",
        );
      }
    } else {
      await state.update("notepadContent", fileContent);
      notifyView?.("updateNotes", { text: fileContent });
      vscode.window.showInformationMessage("Importado com sucesso!");
    }
  } catch {
    vscode.window.showErrorMessage("Erro ao ler arquivo.");
  }
}
