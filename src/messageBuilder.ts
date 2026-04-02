import type { Task } from "./types";

export interface ChatFormatter {
  bold(text: string): string;
  strike(text: string): string;
  italic(text: string): string;
  escape(text: string): string;
  quotePrefix: string;
}

function generateProgressBar(completed: number, total: number, length: number = 10): string {
  if (total === 0) return `[${"░".repeat(length)}] 0%`;
  const percentage = Math.round((completed / total) * 100);
  const filledBlocks = Math.round((percentage / 100) * length);
  const bar = "█".repeat(filledBlocks) + "░".repeat(length - filledBlocks);
  return `[${bar}] ${percentage}%`;
}

// Função auxiliar para mapear prioridades para emojis
function getPriorityEmoji(priority?: string): string {
  switch (priority) {
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

export function buildUnifiedSummary(tasks: Task[], formatter: ChatFormatter): string {
  const pendingTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);
  const date = new Date().toLocaleDateString("pt-BR");

  let message = `🚀 ${formatter.bold(`STATUS REPORT - ${date}`)}\n`;
  message += `${generateProgressBar(completedTasks.length, tasks.length)} `;
  message += `${formatter.italic(`(${completedTasks.length}/${tasks.length} concluídas)`)}\n\n`;

  // --- BLOCO: TAREFAS PENDENTES ---
  if (pendingTasks.length > 0) {
    message += `${formatter.bold("📌 PENDÊNCIAS CRÍTICAS:")}\n`;

    // Pegamos as 10 mais importantes (ou as primeiras)
    pendingTasks.slice(0, 10).forEach((task) => {
      const prio = getPriorityEmoji(task.priority);
      message += `${formatter.quotePrefix} ${prio} ${formatter.bold(formatter.escape(task.text))}\n`;

      // Subtarefas mais compactas
      if (task.subtasks?.length) {
        const doneSub = task.subtasks.filter((s) => s.done).length;
        message += `${formatter.quotePrefix}   └─ 🪜 ${doneSub}/${task.subtasks.length} subtasks\n`;
      }

      // Notas mais limpas (se houver)
      if (task.note?.trim()) {
        const notePreview = task.note.length > 50 ? task.note.substring(0, 47) + "..." : task.note;
        message += `${formatter.quotePrefix}   └─ 📝 ${formatter.italic(formatter.escape(notePreview.replace(/\n/g, " ")))}\n`;
      }
    });

    if (pendingTasks.length > 10) {
      message += `${formatter.quotePrefix} ${formatter.italic(`...e mais ${pendingTasks.length - 10} tarefas pendentes.`)}\n`;
    }
  } else {
    message += `🎉 ${formatter.bold("Tudo limpo!")} Nenhuma pendência encontrada.\n`;
  }

  // --- BLOCO: RECENTEMENTE CONCLUÍDAS ---
  if (completedTasks.length > 0) {
    message += `\n${formatter.bold("✅ ÚLTIMAS CONCLUÍDAS:")}\n`;
    completedTasks.slice(-3).forEach((task) => {
      message += `${formatter.quotePrefix} ${formatter.strike(formatter.escape(task.text))}\n`;
    });
  }

  return message;
}
