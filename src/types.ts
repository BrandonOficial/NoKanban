export interface Task {
  text: string;
  done: boolean;
  priority?: string;
  subtasks?: { text: string; done: boolean }[];
  isExpanded?: boolean;
  note?: string;
  isNoteExpanded?: boolean;
}

export interface StorageData {
  todoList: Task[];
}
