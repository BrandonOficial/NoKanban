import { TaskStore } from "../services/TaskStore";
import type { Task } from "../types";

export class TaskController {
  private store: TaskStore;
  private vscodeAPI: any;
  private taskListEl: HTMLUListElement;
  private taskInputEl: HTMLInputElement;
  private searchInputEl: HTMLInputElement;
  private saveTimeout: number | undefined;

  constructor(initialTasks: Task[], vscodeAPI: any) {
    this.vscodeAPI = vscodeAPI;

    this.taskListEl = document.getElementById("task-list") as HTMLUListElement;
    this.taskInputEl = document.getElementById("task-input") as HTMLInputElement;
    this.searchInputEl = document.getElementById("task-search") as HTMLInputElement;

    // A assinatura do callback agora recebe as tarefas e a flag de re-render
    this.store = new TaskStore(initialTasks, (tasks: Task[], shouldReRender: boolean) => {
      this.handleStateChange(tasks, shouldReRender);
    });

    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    const addBtn = document.getElementById("add-btn");
    addBtn?.addEventListener("click", () => {
      this.store.addTask(this.taskInputEl.value);
      this.taskInputEl.value = "";
    });

    this.taskInputEl.addEventListener("blur", () => {
      this.forceSave();
    });

    this.searchInputEl.addEventListener("blur", () => {
      this.forceSave();
    });
    // Proteção nativa de ciclo de vida (quando o utilizador clica noutro lado)
    window.addEventListener("blur", () => {
      this.forceSave();
    });

    this.taskInputEl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.store.addTask(this.taskInputEl.value);
        this.taskInputEl.value = "";
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.forceSave();
      }
    });

    this.searchInputEl.addEventListener("input", (e) => {
      this.store.setSearch((e.target as HTMLInputElement).value);
    });

    const filterContainer = document.getElementById("filter-container");
    filterContainer?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("chip")) {
        const filter = target.dataset.filter;
        if (filter) this.store.toggleFilter(filter);

        if (filter === "all") {
          filterContainer.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
          target.classList.add("active");
        } else {
          target.classList.toggle("active");
          const allBtn = filterContainer.querySelector('[data-filter="all"]');
          const anyActive = filterContainer.querySelector('.chip.active:not([data-filter="all"])');
          if (!anyActive) allBtn?.classList.add("active");
          else allBtn?.classList.remove("active");
        }
      }
    });
  }

  private forceSave(): void {
    clearTimeout(this.saveTimeout);

    const tasks = this.store.getRawTasks();
    const cleanTasks = tasks.filter((t) => t.text);

    // 🚀 SAFETY NET: Grava na memória nativa e ultra-rápida do VS Code (Síncrono)
    this.vscodeAPI.setState({ tasks: cleanTasks });

    // Envia para o core da extensão no backend (Assíncrono)
    this.vscodeAPI.postMessage({ command: "saveTasks", tasks: cleanTasks });
  }

  private handleStateChange(tasks: Task[], shouldReRender: boolean): void {
    if (shouldReRender) {
      this.forceSave();
      this.render();
    } else {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = window.setTimeout(() => {
        this.forceSave();
      }, 500);
    }
  }
  private render(): void {
    this.taskListEl.innerHTML = "";
    const filtered = this.store.getFilteredTasks();

    if (filtered.length === 0) {
      this.taskListEl.innerHTML =
        '<div class="empty-state"><span>Nenhuma tarefa por aqui!</span></div>';
      return;
    }

    filtered.forEach(({ task, originalIndex }) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.done ? "completed" : ""}`;

      li.innerHTML = `
                <div class="task-main">
                    <div class="checkbox-wrapper">
                        <input type="checkbox" ${task.done ? "checked" : ""} class="task-toggle-btn">
                    </div>
                    <div class="task-content"></div> 
                    <div class="task-actions">
                        <button class="action-mini btn-delete">Lixo</button>
                    </div>
                </div>
            `;

      // Evita injeção de HTML malicioso
      const contentDiv = li.querySelector(".task-content") as HTMLDivElement;
      contentDiv.textContent = task.text;

      const checkbox = li.querySelector(".task-toggle-btn");
      checkbox?.addEventListener("change", () => this.store.toggleTask(originalIndex));

      const deleteBtn = li.querySelector(".btn-delete");
      deleteBtn?.addEventListener("click", () => {
        this.store.deleteTask(originalIndex);
      });

      this.taskListEl.appendChild(li);
    });
  }
}
