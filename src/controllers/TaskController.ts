import { TaskStore } from "../services/TaskStore";
import type { Task } from "../types";

export interface TaskIcons {
  note: string;
  expand: string;
  collapse: string;
  add: string;
  menu: string;
  delete: string;
}

const DEFAULT_ICONS: TaskIcons = {
  note: "📝",
  expand: "▼",
  collapse: "▲",
  add: "+",
  menu: "⋮",
  delete: "✕",
};

export class TaskController {
  private store: TaskStore;
  private vscodeAPI: any;
  private workspaceKey: string;
  private icons: TaskIcons;
  private taskListEl: HTMLUListElement;
  private taskInputEl: HTMLInputElement;
  private searchInputEl: HTMLInputElement;
  private contextMenuEl: HTMLDivElement;
  private contextTargetIndex = -1;
  private saveTimeout: number | undefined;

  constructor(
    initialTasks: Task[],
    vscodeAPI: any,
    workspaceKey: string = "__global__",
    icons: TaskIcons = DEFAULT_ICONS,
  ) {
    this.vscodeAPI = vscodeAPI;
    this.workspaceKey = workspaceKey;
    this.icons = icons;

    this.taskListEl = document.getElementById("task-list") as HTMLUListElement;
    this.taskInputEl = document.getElementById("task-input") as HTMLInputElement;
    this.searchInputEl = document.getElementById("task-search") as HTMLInputElement;
    this.contextMenuEl = document.getElementById("context-menu") as HTMLDivElement;

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
      this.commitPendingInput();
      this.forceSave();
    });

    this.searchInputEl.addEventListener("blur", () => this.forceSave());

    window.addEventListener("blur", () => this.forceSave());

    this.taskInputEl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.store.addTask(this.taskInputEl.value);
        this.taskInputEl.value = "";
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.forceSave();
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

    this.contextMenuEl?.querySelectorAll(".menu-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.contextTargetIndex < 0) return;
        const raw = (btn as HTMLElement).dataset.priority;
        const priority = raw === "" ? undefined : raw;
        this.store.setPriority(this.contextTargetIndex, priority);
        this.closeContextMenu();
      });
    });

    document.addEventListener("click", () => this.closeContextMenu());
  }

  private commitPendingInput(): void {
    const value = this.taskInputEl.value.trim();
    if (!value) return;
    this.store.addTask(value);
    this.taskInputEl.value = "";
  }

  private forceSave(): void {
    clearTimeout(this.saveTimeout);
    const tasks = this.store.getRawTasks();
    const cleanTasks = tasks.filter((t) => t.text);
    this.vscodeAPI.setState({ workspaceKey: this.workspaceKey, tasks: cleanTasks });
    this.vscodeAPI.postMessage({ command: "saveTasks", tasks: cleanTasks });
  }

  private handleStateChange(_tasks: Task[], shouldReRender: boolean): void {
    if (shouldReRender) {
      this.forceSave();
      this.render();
    } else {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = window.setTimeout(() => this.forceSave(), 500);
    }
  }

  private closeContextMenu(): void {
    this.contextMenuEl?.classList.remove("show");
    this.contextTargetIndex = -1;
  }

  private openPriorityMenu(e: Event, index: number): void {
    e.stopPropagation();
    if (!this.contextMenuEl) return;
    this.contextTargetIndex = index;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.contextMenuEl.style.top = `${rect.bottom + 5}px`;
    this.contextMenuEl.style.right = "10px";
    this.contextMenuEl.style.left = "auto";
    this.contextMenuEl.classList.add("show");
  }

  private autoResizeTextarea(el: HTMLTextAreaElement): void {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  private updateProgress(): void {
    const container = document.getElementById("progress-container");
    if (!container) return;

    let total = 0;
    let completed = 0;
    for (const task of this.store.getRawTasks()) {
      total++;
      if (task.done) completed++;
      task.subtasks?.forEach((sub) => {
        total++;
        if (sub.done) completed++;
      });
    }

    if (total === 0) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";
    const percent = Math.round((completed / total) * 100);
    const countEl = document.getElementById("progress-count");
    const percentEl = document.getElementById("progress-percent");
    const fillEl = document.getElementById("progress-fill");
    if (countEl) countEl.textContent = `${completed}/${total} concluídas`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (fillEl) fillEl.style.width = `${percent}%`;
  }

  private render(): void {
    this.updateProgress();
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

      const prioClass = task.priority ? `p-${task.priority}` : "";
      const prioHtml = task.priority
        ? `<span class="priority-dot ${prioClass}" title="Prioridade ${task.priority}"></span>`
        : "";

      const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
      const expandIcon = hasSubtasks
        ? task.isExpanded
          ? this.icons.collapse
          : this.icons.expand
        : this.icons.add;

      const noteBtnClass = task.note?.trim() ? "action-mini has-content" : "action-mini";

      li.innerHTML = `
        <div class="task-main">
          <div class="checkbox-wrapper">
            <input type="checkbox" ${task.done ? "checked" : ""} class="task-toggle-btn">
          </div>
          ${prioHtml}
          <div class="task-content"></div>
          <div class="task-actions">
            <button class="${noteBtnClass} btn-note" title="Nota">${this.icons.note}</button>
            <button class="action-mini btn-expand" title="Subtarefas">${expandIcon}</button>
            <button class="action-mini btn-priority-menu" title="Prioridade">${this.icons.menu}</button>
            <button class="action-mini danger btn-delete" title="Excluir">${this.icons.delete}</button>
          </div>
        </div>
      `;

      const contentDiv = li.querySelector(".task-content") as HTMLDivElement;
      contentDiv.textContent = task.text;

      li.querySelector(".task-toggle-btn")?.addEventListener("change", () =>
        this.store.toggleTask(originalIndex),
      );

      li.querySelector(".btn-note")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.store.toggleNoteExpanded(originalIndex);
      });

      li.querySelector(".btn-expand")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.store.toggleExpand(originalIndex);
      });

      li.querySelector(".btn-priority-menu")?.addEventListener("click", (e) => {
        this.openPriorityMenu(e, originalIndex);
      });

      li.querySelector(".btn-delete")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.store.deleteTask(originalIndex);
      });

      contentDiv.addEventListener("click", () => this.store.toggleTask(originalIndex));

      if (task.isNoteExpanded) {
        const noteDiv = document.createElement("div");
        noteDiv.style.cssText = "padding: 2px 12px 10px 30px;";
        const textarea = document.createElement("textarea");
        textarea.className = "task-note-input";
        textarea.placeholder = "Suas anotações aqui...";
        textarea.value = task.note || "";
        textarea.addEventListener("input", (e) => {
          const el = e.target as HTMLTextAreaElement;
          this.store.updateNote(originalIndex, el.value);
          this.autoResizeTextarea(el);
        });
        textarea.addEventListener("focus", () => this.autoResizeTextarea(textarea));
        noteDiv.appendChild(textarea);
        li.appendChild(noteDiv);
        requestAnimationFrame(() => this.autoResizeTextarea(textarea));
      }

      if (task.isExpanded || hasSubtasks) {
        const subList = document.createElement("div");
        subList.className = `subtasks-list ${task.isExpanded ? "open" : ""}`;

        (task.subtasks || []).forEach((sub, subIdx) => {
          const subRow = document.createElement("div");
          subRow.className = "subtask-item";

          const subCheck = document.createElement("input");
          subCheck.type = "checkbox";
          subCheck.checked = sub.done;
          subCheck.addEventListener("change", () =>
            this.store.toggleSubtask(originalIndex, subIdx),
          );

          const subSpan = document.createElement("span");
          subSpan.textContent = sub.text;
          if (sub.done) {
            subSpan.style.textDecoration = "line-through";
            subSpan.style.opacity = "0.6";
          }

          const subDelete = document.createElement("button");
          subDelete.className = "action-mini danger";
          subDelete.style.width = "16px";
          subDelete.style.height = "16px";
          subDelete.innerHTML = this.icons.delete;
          subDelete.addEventListener("click", (e) => {
            e.stopPropagation();
            this.store.deleteSubtask(originalIndex, subIdx);
          });

          subRow.append(subCheck, subSpan, subDelete);
          subList.appendChild(subRow);
        });

        const subInputWrap = document.createElement("div");
        subInputWrap.className = "subtask-input-wrapper";
        const subInput = document.createElement("textarea");
        subInput.className = "subtask-input";
        subInput.rows = 1;
        subInput.placeholder = "+ Subtarefa";
        subInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const text = subInput.value;
            if (text.trim()) {
              this.store.addSubtask(originalIndex, text);
              subInput.value = "";
            }
          }
        });
        subInput.addEventListener("input", () => this.autoResizeTextarea(subInput));
        subInput.addEventListener("focus", () => this.autoResizeTextarea(subInput));
        subInputWrap.appendChild(subInput);
        subList.appendChild(subInputWrap);

        li.appendChild(subList);
      }

      this.taskListEl.appendChild(li);
    });
  }
}
