import { PomodoroController } from "../controllers/PomodoroController";
import { TaskController } from "../controllers/TaskController";
import { AppController } from "../controllers/AppController";

declare const acquireVsCodeApi: any;
declare global {
  interface Window {
    __INITIAL_DATA__: string;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtém a API de comunicação
  const vscode = acquireVsCodeApi();

  // 2. Faz o parse seguro do estado inicial
  let initialData: any = {};
  try {
    const localState = vscode.getState();
    if (localState && localState.tasks) {
      // Recupera do cache ultra-rápido da Webview (Evita perda de dados)
      initialData.tasks = localState.tasks;

      // Re-sincroniza silenciosamente o backend só por garantia
      vscode.postMessage({ command: "saveTasks", tasks: localState.tasks });
    } else {
      // Fallback: Primeira vez que a Webview abre, lê a string base64 do HTML
      if (window.__INITIAL_DATA__) {
        const rawJson = atob(window.__INITIAL_DATA__);
        initialData = JSON.parse(rawJson);
      }
    }
  } catch (e) {
    console.error("NoKanban: Erro a ler dados iniciais", e);
  }

  // 3. Inicializa os módulos MVC de forma independente
  const taskController = new TaskController(initialData.tasks || [], vscode);
  const pomodoro = new PomodoroController();

  // (Este Controller depende de teres criado o ficheiro AppController.ts com o código que te passei antes)
  const appController = new AppController(vscode, {
    autoBackupEnabled: initialData.autoBackupEnabled,
    autoBackupInterval: initialData.autoBackupInterval,
  });

  // 4. Ouvinte de mensagens vindas do backend (VS Code)
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.command === "updateTasks") {
      // Quando vierem tarefas da cloud ou importações locais
    }
  });

  console.log("NoKanban Webview inicializada de forma robusta e limpa! 🚀");
});
