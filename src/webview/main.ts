import { PomodoroController } from "../controllers/PomodoroController";
import { TaskController, type TaskIcons } from "../controllers/TaskController";
import { AppController } from "../controllers/AppController";
import { resolveInitialTasks } from "./resolveInitialTasks";
import type { Task } from "../types";

declare const acquireVsCodeApi: any;
declare global {
  interface Window {
    __INITIAL_DATA__: string;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const vscode = acquireVsCodeApi();

  let initialData: {
    workspaceKey?: string;
    tasks?: Task[];
    icons?: TaskIcons;
    autoBackupEnabled?: boolean;
    autoBackupInterval?: number;
  } = {};

  try {
    let serverData: typeof initialData = {};
    if (window.__INITIAL_DATA__) {
      const rawJson = atob(window.__INITIAL_DATA__);
      serverData = JSON.parse(rawJson);
    }

    const workspaceKey = serverData.workspaceKey ?? "__global__";
    const localState = vscode.getState();
    const { tasks, shouldSyncToBackend } = resolveInitialTasks(
      serverData.tasks ?? [],
      localState,
      workspaceKey,
    );

    initialData = { ...serverData, tasks };

    if (shouldSyncToBackend) {
      vscode.postMessage({ command: "saveTasks", tasks });
    }
  } catch (e) {
    console.error("NoKanban: Erro a ler dados iniciais", e);
  }

  const taskController = new TaskController(
    initialData.tasks || [],
    vscode,
    initialData.workspaceKey ?? "__global__",
    initialData.icons,
  );
  const pomodoro = new PomodoroController();

  const appController = new AppController(vscode, {
    autoBackupEnabled: initialData.autoBackupEnabled,
    autoBackupInterval: initialData.autoBackupInterval,
  });

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.command === "updateTasks") {
      // Quando vierem tarefas da cloud ou importações locais
    }
  });

  console.log("NoKanban Webview inicializada de forma robusta e limpa! 🚀");
});
