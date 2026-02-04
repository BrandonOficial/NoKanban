export interface QuickNote {
  id: string;
  text: string;
  timestamp: string;
  tags?: string[];
}

export interface Task {
  text: string;
  done: boolean;
  priority?: string;
  subtasks?: { text: string; done: boolean }[];
  isExpanded?: boolean;
}

export interface StorageData {
  notepadContent: string;
  todoList: Task[];
  quickNotes: QuickNote[];
}
