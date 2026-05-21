import * as vscode from "vscode";

interface WebviewContentParams {
  webview: vscode.Webview;
  scriptUri: vscode.Uri;
  workspaceKey: string;
  tasks: any[];
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
  isAuthenticated: boolean;
  gistLastSyncAt: number | null;
  discordUrl: string;
  telegramToken: string;
  telegramChatId: string;
}

const icons = {
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

export function getWebviewContent(params: WebviewContentParams): string {
  // 1. O Estado Global Consolidado
  const stateData = {
    workspaceKey: params.workspaceKey,
    tasks: params.tasks,
    autoBackupEnabled: params.autoBackupEnabled,
    autoBackupInterval: params.autoBackupInterval,
    isAuthenticated: params.isAuthenticated,
    gistLastSyncAt: params.gistLastSyncAt,
    discordUrl: params.discordUrl,
    telegramToken: params.telegramToken,
    telegramChatId: params.telegramChatId,
    icons: icons,
  };

  // 2. Base64 Resolve 100% dos problemas de aspas e quebras de linha!
  const encodedData = Buffer.from(JSON.stringify(stateData)).toString("base64");

  return /* html */ `<!DOCTYPE html>
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

        button { font-family: inherit; border: none; background: none; cursor: pointer; color: inherit; }

        input, select, textarea {
            font-family: inherit;
            color: var(--vscode-input-foreground);
            background: var(--vscode-input-background);
            outline: none !important;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input[type="text"]:not(.timer-input), select { border: 1px solid rgba(128, 128, 128, 0.25); }
        input[type="text"]:not(.timer-input):focus, select:focus, textarea:focus {
            border-color: rgba(144, 202, 249, 0.7) !important;
            box-shadow: 0 0 0 1px rgba(144, 202, 249, 0.2) !important;
        }

        /* --- HEADER --- */
        .header { display: flex; align-items: center; padding: 0 8px; height: 36px; flex-shrink: 0; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background); gap: 8px; }
        .tabs { display: flex; height: 100%; gap: 12px; flex: 1; overflow: hidden; }
        .tab-btn { font-size: 10px; font-weight: 600; text-transform: uppercase; opacity: 0.6; position: relative; height: 100%; display: flex; align-items: center; background: transparent; color: var(--vscode-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tab-btn:hover { opacity: 1; }
        .tab-btn.active { opacity: 1; color: var(--vscode-panelTitle-activeForeground); }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--vscode-panelTitle-activeBorder); }
        .header-actions { display: flex; gap: 2px; flex-shrink: 0; }
        .icon-btn { width: 24px; height: 24px; border-radius: var(--radius-base); display: flex; align-items: center; justify-content: center; color: var(--vscode-icon-foreground); opacity: 0.8; }
        .icon-btn:hover { background: var(--vscode-toolbar-hoverBackground); opacity: 1; }

        .view-container { flex: 1; display: none; flex-direction: column; overflow: hidden; background: var(--vscode-editor-background); }
        .view-container.active { display: flex; }

        /* --- TASKS VIEW --- */
        .tasks-header { padding: var(--padding-base); border-bottom: 1px solid var(--vscode-panel-border); display: flex; flex-direction: column; gap: 8px; background: var(--vscode-sideBar-background); }
        .input-row { display: flex; gap: 6px; width: 100%; }
        #task-input { flex: 1; min-width: 0; padding: 4px 8px; border-radius: 2px; height: 26px; }
        .search-wrapper { position: relative; width: 100%; margin-bottom: 4px; display: flex; }
        .search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--vscode-input-placeholderForeground); opacity: 0.7; pointer-events: none; }
        #task-search { width: 100%; min-width: 0; padding: 4px 8px 4px 28px; border-radius: 2px; font-size: var(--font-size-sm); }
        .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 0 10px; border-radius: 2px; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

        .filter-row { display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 2px; }
        .chip { font-size: 10px; padding: 4px 10px; border-radius: 12px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); opacity: 0.5; white-space: nowrap; transition: all 0.2s; border: 1px solid transparent; font-weight: 500; }
        .chip:hover { opacity: 0.8; cursor: pointer; }
        .chip.active { opacity: 1; border-color: var(--vscode-contrastBorder); }
        .chip[data-filter="high"] { background: transparent; border: 1px solid var(--color-high); color: var(--vscode-foreground); }
        .chip[data-filter="high"].active { background: var(--color-high); color: #000; font-weight: 700; border-color: var(--color-high); }
        .chip[data-filter="medium"] { background: transparent; border: 1px solid var(--color-medium); color: var(--vscode-foreground); }
        .chip[data-filter="medium"].active { background: var(--color-medium); color: #000; font-weight: 700; border-color: var(--color-medium); }
        .chip[data-filter="low"] { background: transparent; border: 1px solid var(--color-low); color: var(--vscode-foreground); }
        .chip[data-filter="low"].active { background: var(--color-low); color: #000; font-weight: 700; border-color: var(--color-low); }

        .progress-container { padding: 8px 12px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); display: none; }
        .progress-text { display: flex; justify-content: space-between; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; font-weight: 500; }
        .progress-bar-bg { height: 4px; background: var(--vscode-scrollbarSlider-background); border-radius: 2px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--vscode-progressBar-background); width: 0%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .task-list { flex: 1; overflow-y: auto; padding: 4px 8px; list-style: none; background: var(--vscode-sideBar-background); }
        .task-item { padding: 6px 8px; margin-bottom: 4px; display: flex; flex-direction: column; border-radius: 6px; border: 1px solid transparent; transition: background 0.2s ease; }
        .task-item:hover { background: var(--vscode-list-hoverBackground); }

        .task-main { display: flex; align-items: flex-start; gap: 8px; min-height: 24px; padding: 2px 0; }
        .checkbox-wrapper { display: flex; align-items: center; justify-content: center; width: 14px; height: 18px; flex-shrink: 0; margin-top: 1px; }
        
        input[type="checkbox"] { appearance: none; width: 14px; height: 14px; border: 1px solid var(--vscode-icon-foreground); border-radius: 3px; background: transparent; cursor: pointer; display: grid; place-content: center; margin: 0; transition: all 0.2s; }
        input[type="checkbox"]:hover { border-color: var(--vscode-focusBorder); }
        input[type="checkbox"]:checked { background: var(--vscode-progressBar-background); border-color: var(--vscode-progressBar-background); }
        input[type="checkbox"]:checked::after { content: "✓"; font-size: 10px; color: white; font-weight: bold; line-height: 1; }

        .priority-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin: 0; margin-top: 7px;}
        .p-high { background: var(--color-high); box-shadow: 0 0 6px var(--color-high); }
        .p-medium { background: var(--color-medium); box-shadow: 0 0 6px var(--color-medium); }
        .p-low { background: var(--color-low); box-shadow: 0 0 6px var(--color-low); }

        .task-content { flex: 1; font-size: 13px; line-height: 1.4; word-break: break-word; overflow-wrap: anywhere; cursor: pointer; padding: 0; margin: 0; padding-top: 1px; }
        .task-item.completed .task-content { text-decoration: line-through; opacity: 0.5; }

        .task-actions { display: flex; align-items: center; gap: 2px; opacity: 0.15; transition: opacity 0.2s; margin-top: 0px; }
        .task-item:hover .task-actions { opacity: 1; }
        .action-mini { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 3px; color: var(--vscode-descriptionForeground); transition: all 0.2s; cursor: pointer; }
        .action-mini:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }
        .action-mini.danger:hover { color: var(--vscode-errorForeground); }
        .action-mini.has-content { opacity: 0.8 !important; }
        .action-mini.has-content:hover { opacity: 1 !important; }

       /* Subtasks */
        .subtasks-list { margin-left: 22px; padding-left: 8px; border-left: 1px dashed var(--vscode-tree-indentGuidesStroke); margin-top: 4px; display: none; }
        .subtasks-list.open { display: block; }

        .subtask-item { display: flex; align-items: flex-start; gap: 6px; padding: 4px 0; font-size: 12px; color: var(--vscode-descriptionForeground); min-height: 24px; }
        .subtask-item input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; }
        .subtask-item span { flex: 1; word-break: break-word; overflow-wrap: anywhere; line-height: 1.4; padding-top: 0px; }
        .subtask-item button { flex-shrink: 0; margin-top: -1px; }

        .subtask-input-wrapper { display: flex; width: 100%; margin-top: 4px; }

        .subtask-input { width: 100%; background: transparent; border: 1px solid transparent; border-radius: 4px; padding: 4px 6px; font-size: 11px; color: var(--vscode-foreground); transition: all 0.2s ease; font-family: var(--vscode-editor-font-family); resize: none; overflow: hidden; min-height: 24px; outline: none; }
        .subtask-input::placeholder { font-style: italic; opacity: 0.5; }
        .subtask-input:hover { background: rgba(128, 128, 128, 0.08); cursor: pointer; }
        .subtask-input:focus { background: var(--vscode-input-background); border-color: rgba(144, 202, 249, 0.3); cursor: text; }

        .task-note-input { width: 100%; background: transparent; border: 1px solid transparent; color: var(--vscode-descriptionForeground); border-radius: 4px; padding: 6px 8px; font-size: 11px; font-family: var(--vscode-editor-font-family); resize: none; min-height: 30px; overflow: hidden; outline: none; margin-top: 4px; transition: all 0.2s ease; }
        .task-note-input:hover { background: rgba(128, 128, 128, 0.05); cursor: pointer; }
        .task-note-input:focus { border-color: rgba(144, 202, 249, 0.3); background: var(--vscode-input-background); color: var(--vscode-input-foreground); cursor: text; }

        /* --- POMODORO --- */
        .pomodoro-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; }
        .timer-wrapper { display: flex; align-items: center; justify-content: center; font-size: clamp(2.5rem, 15vw, 4.5rem); font-weight: 300; margin: 32px 0; font-variant-numeric: tabular-nums; letter-spacing: 2px; transition: color 0.3s ease, text-shadow 0.3s ease; }
        .timer-wrapper.mode-focus { color: var(--vscode-editor-foreground); text-shadow: none; }
        .timer-wrapper.mode-break { color: var(--color-low); text-shadow: 0 0 15px rgba(0, 230, 118, 0.35); }
        .timer-input { background: transparent !important; border: none !important; color: inherit !important; font-size: inherit; font-weight: inherit; font-family: inherit; padding: 0; margin: 0; cursor: pointer; }
        .timer-input:focus { background: rgba(255, 255, 255, 0.05) !important; border-radius: 8px; }
        #timer-mins { width: 3.5ch; text-align: right; }
        #timer-secs { width: 2.5ch; text-align: left; }
        .timer-separator { padding-bottom: 8px; user-select: none; margin: 0 2px; }
        .pomodoro-controls { display: flex; gap: 8px; align-items: center; }
        .btn-pomodoro { padding: 6px 20px; font-size: 13px; border-radius: 4px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s ease, background 0.2s ease; background: var(--color-brand) !important; color: #000 !important; height: 28px; display: flex; align-items: center; }
        .btn-pomodoro:hover { opacity: 0.85; }
        .btn-pomodoro.running { background: var(--vscode-button-secondaryBackground) !important; color: var(--vscode-button-secondaryForeground) !important; }
        .btn-reset { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 4px; border: none; background: transparent; color: var(--vscode-icon-foreground); cursor: pointer; transition: all 0.2s ease; }
        .btn-reset:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }

        /* --- MODAL E CARDS --- */
        .context-menu { position: fixed; background: var(--vscode-menu-background); border: 1px solid var(--vscode-menu-border); box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 100; border-radius: 4px; padding: 4px; display: none; min-width: 100px; }
        .context-menu.show { display: block; }
        .menu-item { width: 100%; text-align: left; padding: 4px 8px; font-size: 11px; border-radius: 2px; display: flex; align-items: center; gap: 6px; color: var(--vscode-menu-foreground); }
        .menu-item:hover { background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; opacity: 0.5; gap: 10px; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 999; display: none; align-items: center; justify-content: center; backdrop-filter: blur(1px); }
        .modal-overlay.active { display: flex; }
        .modal-content { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); box-shadow: 0 4px 12px rgba(0,0,0,0.25); width: 90%; max-width: 350px; border-radius: 6px; overflow-y: auto; max-height: 90vh; }
        .modal-header { padding: 12px; border-bottom: 1px solid var(--vscode-panel-border); display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 12px; background: var(--vscode-sideBarSectionHeader-background); position: sticky; top: 0; z-index: 10; }
        .modal-body { padding: 16px; }
        
        .btn-block { width: 100%; padding: 8px; margin-top: 8px; border-radius: 2px; border: 1px solid var(--vscode-button-border); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-block:hover { background: var(--vscode-button-secondaryHoverBackground); }
        .config-input { width: 100%; padding: 6px 8px; border-radius: 2px; font-size: 11px; margin-top: 4px; margin-bottom: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); }
        .config-input:focus { border-color: var(--vscode-focusBorder); }

        .integration-card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 12px; margin-bottom: 12px; transition: border-color 0.2s ease; }
        .integration-card:hover { border-color: var(--vscode-focusBorder); }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .service-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
        .status-badge { margin-left: auto; font-size: 9px; text-transform: uppercase; padding: 2px 6px; border-radius: 10px; font-weight: bold; }
        .status-connected { background: rgba(0, 230, 118, 0.15); color: #00e676; }
        .status-disconnected { background: rgba(128, 128, 128, 0.15); color: var(--vscode-descriptionForeground); }
        .card-body { display: flex; flex-direction: column; gap: 4px; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
        ::-webkit-scrollbar-track { background: transparent; }
    </style>
</head>
<body>
    <div class="header">
        <div class="tabs">
            <button class="tab-btn active" data-target="tasks">Tarefas</button>
            <button class="tab-btn" data-target="pomodoro">Timer</button>
        </div>
        <div class="header-actions">
            <button class="icon-btn" id="sync-btn" title="Configurações & Integrações">${icons.sync}</button>
        </div>
    </div>

    <div id="view-tasks" class="view-container active">
        <div class="tasks-header">
            <div class="search-wrapper">
                <span class="search-icon" id="icon-search">${icons.search}</span>
                <input type="text" id="task-search" placeholder="Buscar tarefas..." autocomplete="off">
            </div>
            <div class="input-row">
                <input type="text" id="task-input" placeholder="Nova tarefa..." autocomplete="off" />
                <button id="add-btn" class="btn-primary" title="Adicionar Tarefa">${icons.add}</button>
            </div>
            <div class="filter-row" id="filter-container">
                <button class="chip active" data-filter="all">Todas</button>
                <button class="chip" data-filter="pending">Pendentes</button>
                <button class="chip" data-filter="high">Alta</button>
                <button class="chip" data-filter="medium">Média</button>
                <button class="chip" data-filter="low">Baixa</button>
            </div>
        </div>
        
        <div class="progress-container" id="progress-container">
            <div class="progress-text">
                <span id="progress-count">0/0 concluídas</span>
                <span id="progress-percent">0%</span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" id="progress-fill"></div></div>
        </div>
        
        <ul id="task-list" class="task-list"></ul>
    </div>

    <div id="view-pomodoro" class="view-container">
        <div class="pomodoro-wrapper">
            <div class="filter-row" style="justify-content: center; flex-wrap: wrap;">
                <button class="chip active" data-pomo-mode="focus">Timer</button>
                <button class="chip" data-pomo-mode="short">Pausa Curta</button>
                <button class="chip" data-pomo-mode="long">Pausa Longa</button>
            </div>
            <div class="timer-wrapper mode-focus" id="timer-wrapper">
                <input type="text" class="timer-input" id="timer-mins" value="25" maxlength="3" autocomplete="off" spellcheck="false">
                <span class="timer-separator">:</span>
                <input type="text" class="timer-input" id="timer-secs" value="00" maxlength="2" autocomplete="off" spellcheck="false">
            </div>
            <div class="pomodoro-controls">
                <button id="btn-pomo-toggle" class="btn-pomodoro">Iniciar</button>
                <button class="btn-reset" id="btn-reset-pomo">${icons.reset}</button>
            </div>
        </div>
    </div>

    <div id="context-menu" class="context-menu">
        <button class="menu-item" data-priority="high"><span class="priority-dot p-high"></span> Alta</button>
        <button class="menu-item" data-priority="medium"><span class="priority-dot p-medium"></span> Média</button>
        <button class="menu-item" data-priority="low"><span class="priority-dot p-low"></span> Baixa</button>
        <button class="menu-item" data-priority="">Remover Prioridade</button>
    </div>

    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <span>Configurações</span>
                <button class="icon-btn" id="close-settings" title="Fechar">${icons.close}</button>
            </div>
            <div class="modal-body">
                
                <div class="integration-card">
                    <div class="card-header">
                        <div class="service-icon" style="color: var(--vscode-foreground);">${icons.sync}</div>
                        <span style="font-weight: bold;">GitHub Gist</span>
                        <span id="gist-status-badge" class="status-badge ${params.isAuthenticated ? "status-connected" : "status-disconnected"}">
                            ${params.isAuthenticated ? "Conectado" : "Desconectado"}
                        </span>
                    </div>
                    <div class="card-body">
                        <div id="auth-status" style="font-size: 11px; color: var(--vscode-descriptionForeground);">
                            ${params.isAuthenticated ? "Sincronizado com a nuvem." : "Sincronize as suas tarefas na nuvem."}
                        </div>
                        <button class="btn-block" id="btn-auth" style="display: ${params.isAuthenticated ? "none" : "block"}">Conectar Conta</button>
                        <div id="sync-actions" style="display: ${params.isAuthenticated ? "flex" : "none"}; gap:4px;">
                            <button class="btn-block" id="btn-push" title="Salvar dados na nuvem">Enviar ⬆</button>
                            <button class="btn-block" id="btn-pull" title="Baixar dados da nuvem">Baixar ⬇</button>
                        </div>
                    </div>
                </div>

                <div class="integration-card">
                    <div class="card-header">
                        <div class="service-icon" style="color: #5865F2;">${icons.discord}</div>
                        <span style="font-weight: bold;">Discord</span>
                        <span id="discord-status-badge" class="status-badge ${params.discordUrl ? "status-connected" : "status-disconnected"}">
                            ${params.discordUrl ? "Ativo" : "Pendente"}
                        </span>
                    </div>
                    <div class="card-body">
                        <input type="text" id="cfg-discord-url" class="config-input" placeholder="Webhook URL" value="${params.discordUrl}" autocomplete="off" spellcheck="false">
                        <button class="btn-block" id="btn-discord" style="background-color: #5865F2; color: white; border: none;">
                            Enviar Teste para Discord
                        </button>
                    </div>
                </div>

                <div class="integration-card">
                    <div class="card-header">
                        <div class="service-icon" style="color: #2AABEE;">${icons.telegram}</div>
                        <span style="font-weight: bold;">Telegram</span>
                        <span id="telegram-status-badge" class="status-badge ${params.telegramToken ? "status-connected" : "status-disconnected"}">
                            ${params.telegramToken ? "Ativo" : "Pendente"}
                        </span>
                    </div>
                    <div class="card-body">
                        <input type="password" id="cfg-telegram-token" class="config-input" placeholder="Bot Token" value="${params.telegramToken}" autocomplete="off" spellcheck="false" style="margin-bottom: 4px;">
                        <input type="text" id="cfg-telegram-chat" class="config-input" placeholder="Chat ID" value="${params.telegramChatId}" autocomplete="off" spellcheck="false">
                        <button class="btn-block" id="btn-telegram" style="background-color: #2AABEE; color: white; border: none;">
                            Enviar Teste para Telegram
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 12px; display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="chk-backup">
                    <label for="chk-backup" style="font-size:11px;">Backup Automático Local</label>
                </div>

                <button class="btn-block" id="btn-save-config" style="background: var(--vscode-button-background); color: var(--vscode-button-foreground); font-weight: bold; margin-top: 10px;">
                    Guardar Todas as Credenciais
                </button>
                
                <div style="display:flex; gap:4px; margin-top: 8px;">
                    <button class="btn-block" id="btn-export">Exportar Local</button>
                    <button class="btn-block" id="btn-import">Importar Local</button>
                </div>
            </div>
        </div>
    </div>

    <script>window.__INITIAL_DATA__ = "${encodedData}";</script>
    <script src="${params.scriptUri}"></script>
</body>
</html>`;
}
