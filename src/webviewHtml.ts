import * as vscode from "vscode";

// Função auxiliar para escapar caracteres especiais e prevenir quebra de script (XSS/Syntax errors)
export function sanitizeForJson(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

interface WebviewContentParams {
  webview: vscode.Webview;
  tasks: any[];
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
  isAuthenticated: boolean;
  gistLastSyncAt: number | null;
  // Nossas novas credenciais:
  discordUrl: string;
  telegramToken: string;
  telegramChatId: string;
}

// Extraímos os ícones SVG para fora do bloco gigante de HTML para facilitar a manutenção
const ICONS = {
  note: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  expand: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  collapse: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  add: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  menu: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  discord: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>`,
  sync: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a1.873 1.873 0 0 1-1.255 1.327l-.319.094a1.785 1.785 0 0 0-1.201 1.201l-.094.319c-1.79.527-1.79 3.065 0 3.592l.319.094a1.785 1.785 0 0 0 1.201 1.201l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a1.873 1.873 0 0 1 1.255-1.327l.319-.094a1.785 1.785 0 0 0 1.201-1.201l-.094-.319c1.79-.527 1.79-3.065 0-3.592l-.319-.094a1.785 1.785 0 0 0-1.201-1.201l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 1.255 1.327l.319.094c.335.093.58.339.673.673l.094.319c.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-1.255-1.327l-.319-.094a1.785 1.785 0 0 1-1.201-1.201l-.094-.319z"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14" stroke-linecap="round"/></svg>`,
  reset: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`,
  telegram: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
};

export function getWebviewContent({
  tasks,
  autoBackupEnabled,
  autoBackupInterval,
  isAuthenticated,
  gistLastSyncAt,
  discordUrl,
  telegramToken,
  telegramChatId,
}: WebviewContentParams): string {
  // Injeção limpa e segura do estado para dentro do script HTML
  const safeStateData = sanitizeForJson(JSON.stringify(tasks));
  const safeLastSyncAt =
    gistLastSyncAt === null || gistLastSyncAt === undefined
      ? "null"
      : String(gistLastSyncAt);

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* --- RESET & BASE --- */
        :root {
            --padding-base: 12px;
            --radius-base: 4px;
            --font-size-sm: 11px;
            
            --color-high: #ff4444;
            --color-medium: #ffbb00;
            --color-low: #00e676;
            --color-brand: #90caf9;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        button {
            font-family: inherit;
            border: none;
            background: none;
            cursor: pointer;
            color: inherit;
        }

        /* --- INPUTS --- */
        input, select, textarea {
            font-family: inherit;
            color: var(--vscode-input-foreground);
            background: var(--vscode-input-background);
            outline: none !important;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input[type="text"]:not(.timer-input), select {
            border: 1px solid rgba(128, 128, 128, 0.25);
        }
        
        input[type="text"]:not(.timer-input):focus, select:focus, textarea:focus {
            border-color: rgba(144, 202, 249, 0.7) !important;
            box-shadow: 0 0 0 1px rgba(144, 202, 249, 0.2) !important;
        }

        /* --- HEADER (TABS) --- */
        .header {
            display: flex;
            align-items: center;
            padding: 0 8px;
            height: 36px;
            flex-shrink: 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBarSectionHeader-background);
            gap: 8px;
        }

        .tabs { 
            display: flex; 
            height: 100%; 
            gap: 12px; 
            flex: 1; 
            overflow: hidden; 
        }

        .tab-btn {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            opacity: 0.6;
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            background: transparent;
            color: var(--vscode-foreground);
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
        }

        .tab-btn:hover { opacity: 1; }
        
        .tab-btn.active {
            opacity: 1;
            color: var(--vscode-panelTitle-activeForeground);
        }
        
        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -1px; left: 0; right: 0;
            height: 2px;
            background: var(--vscode-panelTitle-activeBorder);
        }

        .header-actions { 
            display: flex; 
            gap: 2px; 
            flex-shrink: 0;
        }

        .icon-btn {
            width: 24px; height: 24px;
            border-radius: var(--radius-base);
            display: flex; align-items: center; justify-content: center;
            color: var(--vscode-icon-foreground);
            opacity: 0.8;
        }
        
        .icon-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
            opacity: 1;
        }

        /* --- VIEWS CONTAINER --- */
        .view-container {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow: hidden;
            background: var(--vscode-editor-background);
        }
        
        .view-container.active { display: flex; }

        /* --- TASKS VIEW --- */
        .tasks-header {
            padding: var(--padding-base);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: var(--vscode-sideBar-background);
        }

        .input-row { 
            display: flex; 
            gap: 6px; 
            width: 100%; 
        }

        #task-input {
            flex: 1;
            min-width: 0;
            padding: 4px 8px;
            border-radius: 2px;
            height: 26px;
        }

        .search-wrapper {
            position: relative;
            width: 100%;
            margin-bottom: 4px;
            display: flex;
        }
        
        .search-icon {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--vscode-input-placeholderForeground);
            opacity: 0.7;
            pointer-events: none;
        }

        #task-search {
            width: 100%;
            min-width: 0;
            padding: 4px 8px 4px 28px;
            border-radius: 2px;
            font-size: var(--font-size-sm);
        }

        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 0 10px;
            border-radius: 2px;
            font-size: 16px;
            line-height: 1;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        
        .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

        .filter-row { display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 2px; }
        .filter-row::-webkit-scrollbar { height: 0; width: 0; }

        .chip {
            font-size: 10px;
            padding: 4px 10px;
            border-radius: 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            opacity: 0.5;
            white-space: nowrap;
            transition: all 0.2s;
            border: 1px solid transparent;
            font-weight: 500;
        }
        
        .chip:hover { opacity: 0.8; cursor: pointer; }
        .chip.active { opacity: 1; border-color: var(--vscode-contrastBorder); }
        
        .chip[data-filter="high"] { background: transparent; border: 1px solid var(--color-high); color: var(--vscode-foreground); }
        .chip[data-filter="high"].active { background: var(--color-high); color: #000; font-weight: 700; border-color: var(--color-high); }
        
        .chip[data-filter="medium"] { background: transparent; border: 1px solid var(--color-medium); color: var(--vscode-foreground); }
        .chip[data-filter="medium"].active { background: var(--color-medium); color: #000; font-weight: 700; border-color: var(--color-medium); }

        .chip[data-filter="low"] { background: transparent; border: 1px solid var(--color-low); color: var(--vscode-foreground); }
        .chip[data-filter="low"].active { background: var(--color-low); color: #000; font-weight: 700; border-color: var(--color-low); }

        /* --- PROGRESS BAR --- */
        .progress-container {
            padding: 8px 12px;
            background: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: none; 
        }
        
        .progress-text {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 6px;
            font-weight: 500;
        }

        .progress-bar-bg {
            height: 4px;
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            width: 0%;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Lista */
        .task-list {
            flex: 1;
            overflow-y: auto;
            padding: 4px 8px;
            list-style: none;
            background: var(--vscode-sideBar-background);
        }

        /* TAREFAS: ESTILO FANTASMA (BORDERLESS) */
        .task-item {
            padding: 6px 8px;
            margin-bottom: 4px;
            display: flex;
            flex-direction: column;
            border-radius: 6px;
            border: 1px solid transparent; 
            transition: background 0.2s ease;
        }

        .task-item:hover { 
            background: var(--vscode-list-hoverBackground); 
        }

        .task-main { 
            display: flex; 
            align-items: center;
            gap: 8px; 
            min-height: 24px; 
        }

        .checkbox-wrapper {
            display: flex; 
            align-items: center; 
            justify-content: center;
            width: 14px; 
            height: 14px;
            flex-shrink: 0;
        }
        
        input[type="checkbox"] {
            appearance: none;
            width: 14px; height: 14px;
            border: 1px solid var(--vscode-icon-foreground);
            border-radius: 3px;
            background: transparent;
            cursor: pointer;
            display: grid; place-content: center;
            margin: 0;
            transition: all 0.2s;
        }

        input[type="checkbox"]:hover {
            border-color: var(--vscode-focusBorder);
        }

        input[type="checkbox"]:checked {
            background: var(--vscode-progressBar-background);
            border-color: var(--vscode-progressBar-background);
        }
        
        input[type="checkbox"]:checked::after {
            content: "✓"; font-size: 10px; color: white; font-weight: bold; line-height: 1;
        }

        .priority-dot {
            width: 6px; height: 6px; border-radius: 50%;
            flex-shrink: 0;
            margin: 0;
        }
        .p-high { background: var(--color-high); box-shadow: 0 0 6px var(--color-high); }
        .p-medium { background: var(--color-medium); box-shadow: 0 0 6px var(--color-medium); }
        .p-low { background: var(--color-low); box-shadow: 0 0 6px var(--color-low); }

        .task-content {
            flex: 1;
            font-size: 13px;
            line-height: 1.4;
            word-break: break-word;
            cursor: pointer;
            padding: 0;
            margin: 0;
        }
        
        .task-item.completed .task-content {
            text-decoration: line-through;
            opacity: 0.5;
        }

        .task-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            opacity: 0.15; 
            transition: opacity 0.2s;
        }
        
        .task-item:hover .task-actions { opacity: 1; }

        .action-mini {
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 3px;
            color: var(--vscode-descriptionForeground);
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .action-mini:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }
        .action-mini.danger:hover { color: var(--vscode-errorForeground); }
        
        .action-mini.has-content {
            opacity: 0.8 !important;
        }
        .action-mini.has-content:hover {
            opacity: 1 !important; 
        }

        /* Subtasks */
        .subtasks-list {
            margin-left: 22px;
            padding-left: 8px;
            border-left: 1px dashed var(--vscode-tree-indentGuidesStroke); 
            margin-top: 4px;
            display: none;
        }
        .subtasks-list.open { display: block; }

        .subtask-item {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 0; font-size: 12px; color: var(--vscode-descriptionForeground);
        }
        
        .subtask-input-wrapper {
            display: flex;
            width: 100%;
            margin-top: 2px;
        }

        .subtask-input {
            width: 100%; 
            background: transparent; 
            border: 1px solid transparent; 
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            color: var(--vscode-foreground);
            transition: all 0.2s ease;
        }
        .subtask-input::placeholder { font-style: italic; opacity: 0.5; }
        
        .subtask-input:hover { 
            background: rgba(128, 128, 128, 0.08); 
            cursor: pointer; 
        }
        
        .subtask-input:focus { 
            background: var(--vscode-input-background); 
            border-color: rgba(144, 202, 249, 0.3); 
            cursor: text; 
        }

        /* --- TASK NOTES (DISCRETAS) --- */
        .task-note-input {
            width: 100%;
            background: transparent; 
            border: 1px solid transparent; 
            color: var(--vscode-descriptionForeground); 
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 11px;
            font-family: var(--vscode-editor-font-family);
            resize: vertical;
            min-height: 45px;
            outline: none;
            margin-top: 4px;
            transition: all 0.2s ease;
        }
        
        .task-note-input:hover {
            background: rgba(128, 128, 128, 0.05); 
            cursor: pointer;
        }
        
        .task-note-input:focus {
            border-color: rgba(144, 202, 249, 0.3); 
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground); 
            cursor: text;
        }

        /* --- POMODORO VIEW --- */
        .pomodoro-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 20px;
        }

        .timer-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(2.5rem, 15vw, 4.5rem);
            font-weight: 300;
            margin: 32px 0;
            font-variant-numeric: tabular-nums;
            letter-spacing: 2px;
            transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        .timer-wrapper.mode-focus {
            color: var(--vscode-editor-foreground);
            text-shadow: none;
        }
        
        .timer-wrapper.mode-break {
            color: var(--color-low); 
            text-shadow: 0 0 15px rgba(0, 230, 118, 0.35); 
        }

        .timer-input {
            background: transparent !important;
            border: none !important;
            color: inherit !important;
            font-size: inherit;
            font-weight: inherit;
            font-family: inherit;
            padding: 0;
            margin: 0;
            cursor: pointer;
        }

        .timer-input:focus {
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 8px;
        }

        #timer-mins { width: 3.5ch; text-align: right; }
        #timer-secs { width: 2.5ch; text-align: left; }

        .timer-separator {
            padding-bottom: 8px;
            user-select: none;
            margin: 0 2px; 
        }

        .pomodoro-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .btn-pomodoro {
            padding: 6px 20px;
            font-size: 13px;
            border-radius: 4px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s ease, background 0.2s ease;
            background: var(--color-brand) !important;
            color: #000 !important;
            height: 28px;
            display: flex;
            align-items: center;
        }
        
        .btn-pomodoro:hover { opacity: 0.85; }
        
        .btn-pomodoro.running {
            background: var(--vscode-button-secondaryBackground) !important;
            color: var(--vscode-button-secondaryForeground) !important;
        }

        .btn-reset {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border-radius: 4px;
            border: none;
            background: transparent;
            color: var(--vscode-icon-foreground);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-reset:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-foreground);
        }

        /* Modal / Menu */
        .context-menu {
            position: fixed;
            background: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 100;
            border-radius: 4px;
            padding: 4px;
            display: none;
            min-width: 100px;
        }
        .context-menu.show { display: block; }
        .menu-item {
            width: 100%; text-align: left; padding: 4px 8px;
            font-size: 11px; border-radius: 2px;
            display: flex; align-items: center; gap: 6px;
            color: var(--vscode-menu-foreground);
        }
        .menu-item:hover {
            background: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
        }

        .empty-state {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; height: 100%; opacity: 0.5; gap: 10px;
        }

        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.3); z-index: 999;
            display: none; align-items: center; justify-content: center;
            backdrop-filter: blur(1px);
        }
        .modal-overlay.active { display: flex; }
        
        .modal-content {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            width: 90%; max-width: 350px;
            border-radius: 6px; overflow: hidden;
            max-height: 90vh; /* Para garantir que scrolla se ficar muito grande */
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex; justify-content: space-between; align-items: center;
            font-weight: 600; font-size: 12px;
            background: var(--vscode-sideBarSectionHeader-background);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .modal-body { padding: 16px; }
        .setting-group { margin-bottom: 16px; }
        .setting-label { display: block; font-size: 11px; margin-bottom: 6px; opacity: 0.8; font-weight: bold;}
        
        .btn-block {
            width: 100%; padding: 8px; margin-top: 8px;
            border-radius: 2px; border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-block:hover { background: var(--vscode-button-secondaryHoverBackground); }

        /* Nova classe para os inputs das configurações */
        .config-input {
            width: 100%;
            padding: 6px 8px;
            border-radius: 2px;
            font-size: 11px;
            margin-top: 4px;
            margin-bottom: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, transparent);
        }
        .config-input:focus {
            border-color: var(--vscode-focusBorder);
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
        ::-webkit-scrollbar-track { background: transparent; }
    </style>
</head>
<body>

    <div class="header">
        <div class="tabs">
            <button class="tab-btn active" data-target="tasks" onclick="switchTab('tasks')">Tarefas</button>
            <button class="tab-btn" data-target="pomodoro" onclick="switchTab('pomodoro')">Timer</button>
        </div>
        <div class="header-actions">
            <button class="icon-btn" id="sync-btn" title="Configurações & Integrações"></button>
        </div>
    </div>

    <div id="view-tasks" class="view-container active">
        <div class="tasks-header">
            <div class="search-wrapper">
                <span class="search-icon" id="icon-search"></span>
                <input type="text" id="task-search" placeholder="Buscar tarefas..." autocomplete="off">
            </div>
            
            <div class="input-row">
                <input type="text" id="task-input" placeholder="Nova tarefa..." autocomplete="off" title="Digite a tarefa e aperte Enter" />
                <button id="add-btn" class="btn-primary" title="Adicionar Tarefa"></button>
            </div>
            
            <div class="filter-row" id="filter-container">
                <button class="chip active" data-filter="all" title="Ver todas as tarefas">Todas</button>
                <button class="chip" data-filter="pending" title="Ocultar tarefas concluídas">Pendentes</button>
                <button class="chip" data-filter="high" title="Filtrar por prioridade alta">Alta</button>
                <button class="chip" data-filter="medium" title="Filtrar por prioridade média">Média</button>
                <button class="chip" data-filter="low" title="Filtrar por prioridade baixa">Baixa</button>
            </div>
        </div>
        
        <div class="progress-container" id="progress-container">
            <div class="progress-text">
                <span id="progress-count">0/0 concluídas</span>
                <span id="progress-percent">0%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="progress-fill"></div>
            </div>
        </div>

        <ul id="task-list" class="task-list"></ul>
    </div>

    <div id="view-pomodoro" class="view-container">
        <div class="pomodoro-wrapper">
            <div class="filter-row" style="justify-content: center; flex-wrap: wrap;">
                <button class="chip active" data-pomo-mode="focus" onclick="setPomodoroMode('focus')">Timer</button>
                <button class="chip" data-pomo-mode="short" onclick="setPomodoroMode('short')">Pausa Curta</button>
                <button class="chip" data-pomo-mode="long" onclick="setPomodoroMode('long')">Pausa Longa</button>
            </div>

            <div class="timer-wrapper mode-focus" id="timer-wrapper">
                <input type="text" class="timer-input" id="timer-mins" value="25" maxlength="3" autocomplete="off" spellcheck="false" title="Clique para editar os minutos">
                <span class="timer-separator">:</span>
                <input type="text" class="timer-input" id="timer-secs" value="00" maxlength="2" autocomplete="off" spellcheck="false" title="Clique para editar os segundos">
            </div>

            <div class="pomodoro-controls">
                <button id="btn-pomo-toggle" class="btn-pomodoro" onclick="togglePomodoro()" title="Iniciar ou Pausar o Timer">
                    Iniciar
                </button>
                <button class="btn-reset" id="btn-reset-pomo" onclick="resetPomodoro()" title="Zerar Timer e voltar ao padrão"></button>
            </div>
        </div>
    </div>

    <div id="context-menu" class="context-menu">
        <button class="menu-item" onclick="applyPriority('high')"><span class="priority-dot p-high"></span> Alta</button>
        <button class="menu-item" onclick="applyPriority('medium')"><span class="priority-dot p-medium"></span> Média</button>
        <button class="menu-item" onclick="applyPriority('low')"><span class="priority-dot p-low"></span> Baixa</button>
        <button class="menu-item" onclick="applyPriority(undefined)">Remover Prioridade</button>
    </div>

    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <span>Configurações</span>
                <button class="icon-btn" id="close-settings" title="Fechar"></button>
            </div>
            <div class="modal-body">
                
                <div class="setting-group" style="padding: 8px; border: 1px dashed var(--vscode-widget-border); border-radius: 4px;">
                    <label class="setting-label">Credenciais do Projeto</label>
                    
                    <input type="text" id="cfg-discord-url" class="config-input" placeholder="URL do Webhook do Discord" value="${discordUrl}" autocomplete="off" spellcheck="false">
                    
                    <input type="password" id="cfg-telegram-token" class="config-input" placeholder="Telegram Bot Token" value="${telegramToken}" autocomplete="off" spellcheck="false" style="margin-bottom: 4px;">
                    
                    <input type="text" id="cfg-telegram-chat" class="config-input" placeholder="Telegram Chat ID" value="${telegramChatId}" autocomplete="off" spellcheck="false">
                    
                    <button class="btn-block" id="btn-save-config" style="background: var(--vscode-button-background); color: var(--vscode-button-foreground); margin-top: 8px; font-weight: bold;">
                        Salvar Credenciais
                    </button>
                </div>

                <div class="setting-group">
                    <label class="setting-label">Sincronização (Gist)</label>
                    <div id="auth-status" style="font-size: 11px; margin-bottom: 8px; color: var(--vscode-descriptionForeground);">Verificando...</div>
                    <button class="btn-block" id="btn-auth">Conectar GitHub</button>
                    <div id="sync-actions" style="display:none; gap:4px; margin-top:4px;">
                        <button class="btn-block" id="btn-push" title="Salvar dados na nuvem">Enviar ⬆</button>
                        <button class="btn-block" id="btn-pull" title="Baixar dados da nuvem">Baixar ⬇</button>
                    </div>
                </div>

                <div class="setting-group">
                    <label class="setting-label">Integrações de Equipe</label>
                    <button class="btn-block" id="btn-discord" style="background-color: #5865F2; color: white; border: none;" title="Disparar resumo do projeto para o Discord">
                        <span id="icon-discord"></span>
                        Enviar Status para Discord
                    </button>
                    <button class="btn-block" id="btn-telegram" style="background-color: #2AABEE; color: white; border: none; margin-top: 6px;" title="Disparar resumo do projeto para o Telegram">
                        <span id="icon-telegram"></span>
                        Enviar Status para Telegram
                    </button>
                </div>

                <div class="setting-group">
                    <label class="setting-label">Dados Locais</label>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-block" id="btn-export" title="Fazer download de backup">Exportar</button>
                        <button class="btn-block" id="btn-import" title="Carregar um backup salvo">Importar</button>
                    </div>
                </div>

                <div class="setting-group">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="chk-backup">
                        <label for="chk-backup" style="font-size:11px;" title="Cria backups automáticos em segundo plano">Backup Automático</label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Recebemos a string JSON sanitizada e parseamos em segurança
        const rawState = "${safeStateData}";
        let parsedTasks = [];
        try {
            parsedTasks = JSON.parse(rawState);
        } catch(e) {
            console.error("Erro ao fazer parse das tasks:", e);
        }

        let state = {
            tasks: parsedTasks,
            activeFilters: new Set(),
            search: '',
            contextTargetIndex: -1
        };

        const els = {
            taskList: document.getElementById('task-list'),
            taskInput: document.getElementById('task-input'),
            search: document.getElementById('task-search'),
            modal: document.getElementById('settings-modal'),
            contextMenu: document.getElementById('context-menu')
        };

        const icons = ${JSON.stringify(ICONS)};

        // Injetar ícones estáticos no HTML na inicialização
        document.getElementById('sync-btn').innerHTML = icons.sync;
        document.getElementById('icon-search').innerHTML = icons.search;
        document.getElementById('add-btn').innerHTML = icons.add;
        document.getElementById('btn-reset-pomo').innerHTML = icons.reset;
        document.getElementById('close-settings').innerHTML = icons.close;
        document.getElementById('icon-discord').innerHTML = icons.discord;
        document.getElementById('icon-telegram').innerHTML = icons.telegram;

        document.getElementById('chk-backup').checked = ${autoBackupEnabled};
        updateAuthUI(${isAuthenticated}, ${safeLastSyncAt});
        renderTasks();

        window.switchTab = (tab) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
            
            document.querySelector(\`.tab-btn[data-target="\${tab}"]\`).classList.add('active');
            document.getElementById('view-' + tab).classList.add('active');
            
            if(tab === 'tasks') els.taskInput.focus();
        };

        // --- PROGRESSO DAS TAREFAS (COM SUBTASKS) ---
        function updateProgress() {
            const container = document.getElementById('progress-container');
            let totalItems = 0;
            let completedItems = 0;

            state.tasks.forEach(task => {
                totalItems++;
                if (task.done) completedItems++;
                if (task.subtasks && task.subtasks.length > 0) {
                    task.subtasks.forEach(sub => {
                        totalItems++;
                        if (sub.done) completedItems++;
                    });
                }
            });
            
            if (totalItems === 0) {
                container.style.display = 'none';
                return;
            }
            
            container.style.display = 'block';
            const percent = Math.round((completedItems / totalItems) * 100);
            
            document.getElementById('progress-count').textContent = \`\${completedItems}/\${totalItems} concluídas\`;
            document.getElementById('progress-percent').textContent = \`\${percent}%\`;
            document.getElementById('progress-fill').style.width = \`\${percent}%\`;
        }

        // --- LÓGICA DO POMODORO ---
        const POMO_TIMES = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
        let pomoState = { mode: 'focus', timeLeft: POMO_TIMES.focus, interval: null, isRunning: false };

        const timerWrapper = document.getElementById('timer-wrapper');
        const inputMins = document.getElementById('timer-mins');
        const inputSecs = document.getElementById('timer-secs');
        const btnPomoToggle = document.getElementById('btn-pomo-toggle');

        function updateTimerDisplay() {
            if (document.activeElement !== inputMins && document.activeElement !== inputSecs) {
                inputMins.value = Math.floor(pomoState.timeLeft / 60).toString().padStart(2, '0');
                inputSecs.value = (pomoState.timeLeft % 60).toString().padStart(2, '0');
            }
        }

        function handleTimerEdit() {
            let m = parseInt(inputMins.value) || 0;
            let s = parseInt(inputSecs.value) || 0;
            if (m < 0) m = 0;
            if (s < 0) s = 0;
            if (s > 59) s = 59;
            if (m === 0 && s === 0) m = 1;
            
            pomoState.timeLeft = (m * 60) + s;
            inputMins.value = m.toString().padStart(2, '0');
            inputSecs.value = s.toString().padStart(2, '0');
            updateTimerDisplay();
        }

        [inputMins, inputSecs].forEach(input => {
            input.addEventListener('focus', () => {
                if (pomoState.isRunning) togglePomodoro();
                input.select();
            });
            input.addEventListener('blur', handleTimerEdit);
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') input.blur(); });
        });

        window.setPomodoroMode = (mode) => {
            if (pomoState.isRunning) {
                clearInterval(pomoState.interval);
                pomoState.isRunning = false;
                btnPomoToggle.textContent = 'Iniciar';
                btnPomoToggle.classList.remove('running');
            }
            pomoState.mode = mode;
            pomoState.timeLeft = POMO_TIMES[mode];
            updateTimerDisplay();
            timerWrapper.className = 'timer-wrapper mode-' + (mode === 'focus' ? 'focus' : 'break');
            document.querySelectorAll('[data-pomo-mode]').forEach(btn => btn.classList.remove('active'));
            document.querySelector(\`[data-pomo-mode="\${mode}"]\`).classList.add('active');
        };

        window.togglePomodoro = () => {
            inputMins.blur();
            inputSecs.blur();

            if (pomoState.isRunning) {
                clearInterval(pomoState.interval);
                pomoState.isRunning = false;
                btnPomoToggle.textContent = 'Continuar';
                btnPomoToggle.classList.remove('running');
            } else {
                pomoState.isRunning = true;
                btnPomoToggle.textContent = 'Pausar';
                btnPomoToggle.classList.add('running');
                pomoState.interval = setInterval(() => {
                    if (pomoState.timeLeft > 0) {
                        pomoState.timeLeft--;
                        updateTimerDisplay();
                    } else {
                        clearInterval(pomoState.interval);
                        pomoState.isRunning = false;
                        btnPomoToggle.textContent = 'Iniciar';
                        btnPomoToggle.classList.remove('running');
                        vscode.postMessage({ command: 'notify', text: 'O tempo do Timer acabou!' });
                    }
                }, 1000);
            }
        };

        window.resetPomodoro = () => {
            clearInterval(pomoState.interval);
            pomoState.isRunning = false;
            pomoState.timeLeft = POMO_TIMES[pomoState.mode];
            updateTimerDisplay();
            btnPomoToggle.textContent = 'Iniciar';
            btnPomoToggle.classList.remove('running');
        };
        updateTimerDisplay();

        // --- LÓGICA DE TAREFAS E INTERFACE ---
        document.getElementById('add-btn').addEventListener('click', addTask);
        els.taskInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addTask(); });
        els.search.addEventListener('input', (e) => { state.search = e.target.value.toLowerCase(); renderTasks(); });

        document.querySelectorAll('.filter-row#filter-container .chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (!filter) return;
                if (filter === 'all') {
                    state.activeFilters.clear();
                    document.querySelectorAll('.filter-row#filter-container .chip').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                } else {
                    if (state.activeFilters.has(filter)) {
                        state.activeFilters.delete(filter);
                        btn.classList.remove('active');
                    } else {
                        state.activeFilters.add(filter);
                        btn.classList.add('active');
                    }
                    const allBtn = document.querySelector('.filter-row#filter-container .chip[data-filter="all"]');
                    if (state.activeFilters.size === 0) allBtn.classList.add('active');
                    else allBtn.classList.remove('active');
                }
                renderTasks();
            });
        });

        document.getElementById('sync-btn').addEventListener('click', () => els.modal.classList.add('active'));
        document.getElementById('close-settings').addEventListener('click', () => els.modal.classList.remove('active'));
        els.modal.addEventListener('click', (e) => { if(e.target === els.modal) els.modal.classList.remove('active'); });

        // Lógica para salvar as credenciais digitadas na UI
        document.getElementById('btn-save-config').addEventListener('click', () => {
            const dUrl = document.getElementById('cfg-discord-url').value.trim();
            const tToken = document.getElementById('cfg-telegram-token').value.trim();
            const tChat = document.getElementById('cfg-telegram-chat').value.trim();
            
            post('saveConfig', { 
                discordUrl: dUrl, 
                telegramToken: tToken, 
                telegramChatId: tChat 
            });
            
            // Feedback visual gostosinho no botão
            const btn = document.getElementById('btn-save-config');
            const oldText = btn.textContent;
            btn.textContent = 'Salvo! ✓';
            setTimeout(() => { btn.textContent = oldText; }, 2000);
        });

        document.getElementById('btn-auth').addEventListener('click', () => post('authenticateGist'));
        document.getElementById('btn-push').addEventListener('click', () => post('pushGist'));
        document.getElementById('btn-pull').addEventListener('click', () => post('pullGist'));
        document.getElementById('btn-export').addEventListener('click', () => post('export'));
        document.getElementById('btn-import').addEventListener('click', () => post('import'));
        document.getElementById('chk-backup').addEventListener('change', (e) => {
            post('enableAutoBackup', { enabled: e.target.checked, interval: ${autoBackupInterval} });
        });

        document.addEventListener('click', (e) => {
            if(!e.target.closest('.action-mini')) els.contextMenu.classList.remove('show');
        });

        function post(cmd, data = {}) { vscode.postMessage({ command: cmd, ...data }); }

        function addTask() {
            const text = els.taskInput.value.trim();
            if(!text) return;
            state.tasks.push({ text, done: false, priority: undefined, subtasks: [], isExpanded: true, note: "", isNoteExpanded: false });
            els.taskInput.value = '';
            saveTasks();
        }

        function saveTasks() {
            renderTasks();
            const clean = state.tasks.filter(t => t.text);
            post('saveTasks', { tasks: clean });
        }

        window.openPriorityMenu = (e, index) => {
            e.stopPropagation();
            state.contextTargetIndex = index;
            const rect = e.target.getBoundingClientRect();
            els.contextMenu.style.top = (rect.bottom + 5) + 'px';
            els.contextMenu.style.right = '10px';
            els.contextMenu.classList.add('show');
        };

        window.applyPriority = (prio) => {
            if(state.contextTargetIndex > -1) {
                state.tasks[state.contextTargetIndex].priority = prio;
                saveTasks();
            }
            els.contextMenu.classList.remove('show');
        };

        function renderTasks() {
            updateProgress();
            els.taskList.innerHTML = '';
            
            const filtered = state.tasks.map((t, i) => ({...t, origIndex: i})).filter(t => {
                if(state.search && !t.text.toLowerCase().includes(state.search)) return false;
                if(state.activeFilters.has('pending') && t.done) return false;
                const activePriorities = ['high', 'medium', 'low'].filter(p => state.activeFilters.has(p));
                if (activePriorities.length > 0 && !activePriorities.includes(t.priority)) return false;
                return true;
            });

            if(filtered.length === 0) {
                els.taskList.innerHTML = '<div class="empty-state"><span>Nenhuma tarefa por aqui!</span></div>';
                return;
            }

            filtered.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item ' + (task.done ? 'completed' : '');
                
                const prioClass = task.priority ? 'p-' + task.priority : '';
                const prioHtml = task.priority ? \`<span class="priority-dot \${prioClass}" title="Prioridade \${task.priority}"></span>\` : '';
                const statusTitle = task.done ? 'Marcar como Pendente' : 'Marcar como Concluída';
                const expandTitle = task.subtasks?.length ? (task.isExpanded ? 'Ocultar Subtarefas' : 'Ver Subtarefas') : 'Adicionar Subtarefa';
                
                const noteBtnClass = task.note?.trim() ? 'action-mini has-content' : 'action-mini';
                const expandIcon = task.subtasks?.length ? (task.isExpanded ? icons.collapse : icons.expand) : icons.add;

                li.innerHTML = \`
                    <div class="task-main">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" \${task.done ? 'checked' : ''} onchange="toggleTask(\${task.origIndex})" title="\${statusTitle}">
                        </div>
                        \${prioHtml}
                        <div class="task-content" onclick="toggleTask(\${task.origIndex})" title="Clique para concluir a tarefa">\${task.text}</div>
                        <div class="task-actions">
                            <button class="\${noteBtnClass}" onclick="toggleNote(\${task.origIndex})" title="Adicionar / Ver Anotações">\${icons.note}</button>
                            <button class="action-mini" onclick="toggleExpand(\${task.origIndex})" title="\${expandTitle}">\${expandIcon}</button>
                            <button class="action-mini" onclick="openPriorityMenu(event, \${task.origIndex})" title="Definir Nível de Prioridade">\${icons.menu}</button>
                            <button class="action-mini danger" onclick="deleteTask(\${task.origIndex})" title="Excluir Tarefa Permanentemente">\${icons.delete}</button>
                        </div>
                    </div>
                \`;

                if(task.isNoteExpanded) {
                    const noteDiv = document.createElement('div');
                    noteDiv.style.padding = '0 12px 12px 30px'; 
                    noteDiv.innerHTML = \`<textarea class="task-note-input" placeholder="Cole links, mensagens de erro, referências..." oninput="updateTaskNote(event, \${task.origIndex})">\${task.note || ''}</textarea>\`;
                    li.appendChild(noteDiv);
                }

                if(task.isExpanded || (task.subtasks && task.subtasks.length > 0)) {
                    const subList = document.createElement('div');
                    subList.className = 'subtasks-list ' + (task.isExpanded ? 'open' : '');
                    (task.subtasks || []).forEach((sub, subIdx) => {
                        const subStatus = sub.done ? 'Marcar como Pendente' : 'Marcar como Concluída';
                        const subRow = document.createElement('div');
                        subRow.className = 'subtask-item';
                        subRow.innerHTML = \`
                            <input type="checkbox" \${sub.done ? 'checked' : ''} onchange="toggleSub(\${task.origIndex}, \${subIdx})" title="\${subStatus}">
                            <span style="\${sub.done ? 'text-decoration:line-through;opacity:0.6':''} flex:1" title="Subtarefa">\${sub.text}</span>
                            <button class="action-mini danger" style="width:16px;height:16px" onclick="deleteSub(\${task.origIndex}, \${subIdx})" title="Excluir Subtarefa">\${icons.delete}</button>
                        \`;
                        subList.appendChild(subRow);
                    });
                    const subInput = document.createElement('div');
                    subInput.className = 'subtask-input-wrapper';
                    subInput.innerHTML = \`<input type="text" class="subtask-input" placeholder="+ Adicionar Subtarefa" onkeypress="addSub(event, \${task.origIndex})" title="Clique para digitar e aperte Enter">\`;
                    subList.appendChild(subInput);
                    li.appendChild(subList);
                }
                els.taskList.appendChild(li);
            });
        }
        
        window.toggleTask = (i) => { 
            const task = state.tasks[i];
            task.done = !task.done; 
            if (task.subtasks && task.subtasks.length > 0) task.subtasks.forEach(sub => sub.done = task.done);
            saveTasks(); 
        };
        
        window.deleteTask = (i) => { state.tasks.splice(i, 1); saveTasks(); };
        window.toggleExpand = (i) => { state.tasks[i].isExpanded = !state.tasks[i].isExpanded; saveTasks(); };
        window.toggleNote = (i) => { state.tasks[i].isNoteExpanded = !state.tasks[i].isNoteExpanded; saveTasks(); };
        window.updateTaskNote = (e, i) => { state.tasks[i].note = e.target.value; post('saveTasks', { tasks: state.tasks.filter(t => t.text) }); };
        window.addSub = (e, i) => {
            if(e.key === 'Enter' && e.target.value.trim()) {
                if(!state.tasks[i].subtasks) state.tasks[i].subtasks = [];
                state.tasks[i].subtasks.push({text: e.target.value, done: false});
                state.tasks[i].done = false;
                saveTasks();
            }
        };
        window.toggleSub = (pi, si) => { 
            state.tasks[pi].subtasks[si].done = !state.tasks[pi].subtasks[si].done; 
            state.tasks[pi].done = state.tasks[pi].subtasks.every(sub => sub.done);
            saveTasks(); 
        };
        window.deleteSub = (pi, si) => {
            state.tasks[pi].subtasks.splice(si, 1);
            if (state.tasks[pi].subtasks.length > 0) state.tasks[pi].done = state.tasks[pi].subtasks.every(sub => sub.done);
            saveTasks();
        };

        function updateAuthUI(auth, lastSync) {
            const statusDiv = document.getElementById('auth-status');
            const btnAuth = document.getElementById('btn-auth');
            const syncActions = document.getElementById('sync-actions');
            
            if(auth) {
                statusDiv.textContent = '● Conectado ao GitHub';
                statusDiv.style.color = '#00e676';
                btnAuth.style.display = 'none';
                syncActions.style.display = 'flex';
            } else {
                statusDiv.textContent = '○ Desconectado';
                statusDiv.style.color = 'inherit';
                btnAuth.style.display = 'block';
                syncActions.style.display = 'none';
            }
        }

        window.addEventListener('message', event => {
            const msg = event.data;
            switch(msg.command) {
                case 'updateTasks': 
                    state.tasks = msg.tasks || []; 
                    renderTasks(); 
                    break;
                case 'updateAuthStatus': 
                    updateAuthUI(msg.authenticated, msg.lastSyncAt); 
                    break;
                case 'clearAll': 
                    state.tasks = []; 
                    renderTasks(); 
                    break;
            }
        });

        document.getElementById('btn-discord').addEventListener('click', () => post('pushDiscord'));
        document.getElementById('btn-telegram').addEventListener('click', () => post('pushTelegram'));
    </script>
</body>
</html>`;
}