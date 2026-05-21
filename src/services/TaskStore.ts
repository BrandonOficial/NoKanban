import type { Task } from "../types";

export class TaskStore {
  private tasks: Task[] = [];
  private search: string = "";
  private activeFilters: Set<string> = new Set();

  // Injetamos um callback para notificar quando os dados mudam (Observer Pattern)
  constructor(
    initialTasks: Task[],
    private onTasksChanged: (tasks: Task[], shouldReRender: boolean) => void,
  ) {
    this.tasks = initialTasks;
  }

  public addTask(text: string): void {
    if (!text.trim()) return;
    this.tasks.push({
      text: text.trim(),
      done: false,
      isExpanded: true,
      subtasks: [],
      note: "",
      isNoteExpanded: false,
    });
    this.notify();
  }

  public toggleTask(index: number): void {
    const task = this.tasks[index];
    task.done = !task.done;
    if (task.subtasks) {
      task.subtasks.forEach((sub) => (sub.done = task.done));
    }
    this.notify();
  }

  public deleteTask(index: number): void {
    // Remove 1 elemento a partir do índice passado
    this.tasks.splice(index, 1);

    // Notifica o Controller que os dados mudaram e ele precisa recriar a UI
    this.notify();
  }

  // Nota: Atualizar a nota não deve disparar um re-render completo para não perder o foco
  public updateNote(index: number, note: string): void {
    this.tasks[index].note = note;
    this.notify(false); // Flag false = guarda os dados, mas não recria o ecrã
  }

  public setSearch(query: string): void {
    this.search = query.toLowerCase();
    this.notify(); // Recria o ecrã para filtrar
  }

  public toggleFilter(filter: string): void {
    if (filter === "all") {
      this.activeFilters.clear();
    } else {
      if (this.activeFilters.has(filter)) {
        this.activeFilters.delete(filter);
      } else {
        this.activeFilters.add(filter);
      }
    }
    this.notify();
  }

  public getFilteredTasks(): { task: Task; originalIndex: number }[] {
    return this.tasks
      .map((task, index) => ({ task, originalIndex: index }))
      .filter(({ task }) => {
        if (this.search && !task.text.toLowerCase().includes(this.search)) return false;
        if (this.activeFilters.has("pending") && task.done) return false;

        const activePriorities = ["high", "medium", "low"].filter((p) => this.activeFilters.has(p));
        if (
          activePriorities.length > 0 &&
          (!task.priority || !activePriorities.includes(task.priority))
        )
          return false;

        return true;
      });
  }

  public getRawTasks(): Task[] {
    return this.tasks;
  }

  private notify(shouldReRender: boolean = true): void {
    this.onTasksChanged(this.tasks, shouldReRender);
  }
}
