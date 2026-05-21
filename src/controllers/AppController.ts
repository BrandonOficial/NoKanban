export class AppController {
  private vscodeAPI: any;
  private modal: HTMLElement;

  constructor(vscodeAPI: any, initialConfig: any) {
    this.vscodeAPI = vscodeAPI;
    this.modal = document.getElementById("settings-modal") as HTMLElement;

    this.bindTabs();
    this.bindModals();
    this.bindIntegrations(initialConfig);
  }

  private bindTabs(): void {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const targetTab = (e.target as HTMLElement).dataset.target;

        // Remove active de todos
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".view-container").forEach((v) => v.classList.remove("active"));

        // Adiciona active no clicado
        (e.target as HTMLElement).classList.add("active");
        document.getElementById("view-" + targetTab)?.classList.add("active");

        // UX: Focar no input de tarefas se mudar para essa aba
        if (targetTab === "tasks") {
          document.getElementById("task-input")?.focus();
        }
      });
    });
  }

  private bindModals(): void {
    const syncBtn = document.getElementById("sync-btn");
    const closeBtn = document.getElementById("close-settings");

    syncBtn?.addEventListener("click", () => this.modal.classList.add("active"));
    closeBtn?.addEventListener("click", () => this.modal.classList.remove("active"));

    // Fechar ao clicar fora
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.modal.classList.remove("active");
    });
  }

  private bindIntegrations(config: any): void {
    // Configurações e Checkboxes
    const chkBackup = document.getElementById("chk-backup") as HTMLInputElement;
    if (chkBackup && config) {
      chkBackup.checked = config.autoBackupEnabled;
      chkBackup.addEventListener("change", (e) => {
        this.vscodeAPI.postMessage({
          command: "enableAutoBackup",
          enabled: (e.target as HTMLInputElement).checked,
          interval: config.autoBackupInterval,
        });
      });
    }

    // Botões de Ação Simples (SRP puro, o Controller só despacha o evento)
    const actions: Record<string, string> = {
      "btn-auth": "authenticateGist",
      "btn-push": "pushGist",
      "btn-pull": "pullGist",
      "btn-export": "export",
      "btn-import": "import",
      "btn-discord": "pushDiscord",
      "btn-telegram": "pushTelegram",
    };

    for (const [id, command] of Object.entries(actions)) {
      document.getElementById(id)?.addEventListener("click", () => {
        this.vscodeAPI.postMessage({ command });
      });
    }

    // Guardar Credenciais
    document.getElementById("btn-save-config")?.addEventListener("click", (e) => {
      const btn = e.target as HTMLButtonElement;
      this.vscodeAPI.postMessage({
        command: "saveConfig",
        discordUrl: (document.getElementById("cfg-discord-url") as HTMLInputElement).value.trim(),
        telegramToken: (
          document.getElementById("cfg-telegram-token") as HTMLInputElement
        ).value.trim(),
        telegramChatId: (
          document.getElementById("cfg-telegram-chat") as HTMLInputElement
        ).value.trim(),
      });

      // Feedback visual rápido
      const oldText = btn.textContent;
      btn.textContent = "Salvo! ✓";
      setTimeout(() => {
        btn.textContent = oldText;
      }, 2000);
    });
  }
}
