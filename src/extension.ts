import * as vscode from "vscode";
import { NotificationService } from "./NotificationService";
import { DiscordProvider } from "./notifications/DiscordProvider";
import { TelegramProvider } from "./notifications/TelegramProvider";
import { BackupScheduler } from "./BackupScheduler";
import { WebviewMessageController } from "./WebviewMessageController";
import { NotepadSidebarProvider } from "./NotepadSidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  // 1. Resolve o Escopo de Estado (Workspace vs Global)
  const taskState =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? context.workspaceState
      : context.globalState;

  // 2. Monta as Ferramentas de Infraestrutura (Notificações)
  const notificationProviders = [new DiscordProvider(), new TelegramProvider()];
  const notificationService = new NotificationService(notificationProviders);

  // 3. Inicializa Jobs em Background
  const backupScheduler = new BackupScheduler(
    context.globalState,
    taskState,
    context.globalStorageUri,
    notificationService,
  );
  backupScheduler.schedule();

  // 4. Monta a View injetando as dependências pesadas
  const provider = new NotepadSidebarProvider(
    context.extensionUri,
    taskState,
    context.globalState,
    // Passamos uma Factory para o Controller, pois ele precisa dos callbacks da View
    (notifyView, updateBadge) =>
      new WebviewMessageController(
        context.globalState,
        taskState,
        notificationService,
        backupScheduler,
        notifyView,
        updateBadge,
      ),
  );

  // 5. Registra tudo no ciclo de vida do VS Code
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("notepad-sidebar", provider),
    vscode.commands.registerCommand("notepad.clear", () => provider.clearNotes()),
    vscode.commands.registerCommand("nokanban.sendReport", async () => {
      await notificationService.sendProjectStatus(
        "✅ *Status Report:* Mais uma task concluída no NoKanban! 🔥",
      );
      vscode.window.showInformationMessage("NoKanban: Status enviado para o time!");
    }),
  );
}
