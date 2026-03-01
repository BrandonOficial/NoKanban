import type { Task } from "./types";

// Interface (Contrato) que toda plataforma de chat deve seguir
export interface ChatFormatter {
  bold(text: string): string;
  strike(text: string): string;
  italic(text: string): string;
  escape(text: string): string;
  quotePrefix: string;
}

// Helper: Cria uma barra visual de progresso estilo CLI [██████░░░░] 60%
function generateProgressBar(
  completed: number,
  total: number,
  length: number = 10,
): string {
  if (total === 0) {
    return `[${"░".repeat(length)}] 0%`;
  }

  const percentage = Math.round((completed / total) * 100);
  const filledBlocks = Math.round((percentage / 100) * length);
  const emptyBlocks = length - filledBlocks;

  const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
  return `[${bar}] ${percentage}%`;
}

export function buildUnifiedSummary(
  tasks: Task[],
  formatter: ChatFormatter,
): string {
  const pendingTasks = tasks.filter((task) => !task.done);
  const completedTasks = tasks.filter((task) => task.done);
  const totalCount = tasks.length;

  const date = new Date().toLocaleDateString("pt-BR");
  let message = `${formatter.bold(`📅 Status Report do Projeto - ${date}`)}\n`;

  // Aqui chamamos o nosso novo helper!
  const progressBar = generateProgressBar(completedTasks.length, totalCount);
  message += `📊 ${formatter.bold("Progresso:")} ${progressBar} (${completedTasks.length}/${totalCount} tarefas)\n\n`;

  if (totalCount === 0) {
    return (
      message +
      "Nenhuma tarefa registrada neste projeto ainda. Bora começar! 🚀"
    );
  }

  // Bloco 1: Pendências
  if (pendingTasks.length > 0) {
    message += `${formatter.bold("📌 PENDÊNCIAS:")}\n`;

    pendingTasks.slice(0, 10).forEach((task) => {
      const priorityIcon =
        task.priority === "high"
          ? "🔴"
          : task.priority === "medium"
            ? "🟡"
            : task.priority === "low"
              ? "🟢"
              : "⚪";

      message += `${formatter.quotePrefix}${priorityIcon} ${formatter.bold(`[ ] ${formatter.escape(task.text)}`)}\n`;

      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((sub) => {
          const subIcon = sub.done ? "[x]" : "[ ]";
          message += `${formatter.quotePrefix}      ${subIcon} ${formatter.escape(sub.text)}\n`;
        });
      }

      if (task.note && task.note.trim() !== "") {
        const cleanNote = task.note.replace(/\n/g, " ");
        const notePreview =
          cleanNote.length > 60
            ? cleanNote.substring(0, 60) + "..."
            : cleanNote;
        message += `${formatter.quotePrefix}      📝 ${formatter.italic(formatter.escape(notePreview))}\n`;
      }
    });

    if (pendingTasks.length > 10) {
      message += `${formatter.quotePrefix}${formatter.italic(`...e mais ${pendingTasks.length - 10} pendências.`)}\n`;
    }
    message += "\n";
  } else {
    message += `🎉 ${formatter.bold("Tudo limpo!")} Não existem tarefas pendentes neste projeto.\n\n`;
  }

  // Bloco 2: Últimas Concluídas
  if (completedTasks.length > 0) {
    message += `${formatter.bold("✅ ÚLTIMAS CONCLUÍDAS:")}\n`;

    completedTasks.slice(0, 5).forEach((task) => {
      message += `${formatter.quotePrefix}✨ ${formatter.strike(formatter.escape(task.text))}\n`;
    });

    if (completedTasks.length > 5) {
      message += `${formatter.quotePrefix}${formatter.italic(`...e mais ${completedTasks.length - 5} tarefas finalizadas.`)}\n`;
    }
  }

  return message;
}
