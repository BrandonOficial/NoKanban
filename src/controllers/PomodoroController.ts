import { PomodoroTimer, PomodoroMode } from "../services/PomodoroTimer";

export class PomodoroController {
  private timer: PomodoroTimer;

  // Referências estritas aos elementos do DOM
  private inputMins: HTMLInputElement;
  private inputSecs: HTMLInputElement;
  private btnToggle: HTMLButtonElement;
  private btnReset: HTMLButtonElement;
  private timerWrapper: HTMLElement;
  private modeButtons: NodeListOf<HTMLButtonElement>;

  constructor() {
    // 1. "Fail Fast": Fazemos o bind dos elementos logo no arranque
    this.bindElements();

    // 2. Injeção da lógica pura: O Controller não calcula o tempo,
    // apenas injeta os callbacks que dizem como atualizar a interface (UI)
    this.timer = new PomodoroTimer(
      (timeLeft) => this.updateDisplay(timeLeft),
      (isRunning, mode) => this.updateStateUI(isRunning, mode),
      () => this.onTimerComplete(),
    );

    // 3. Ligamos os eventos do rato/teclado
    this.attachEventListeners();

    // 4. Inicializa o ecrã com o tempo correto
    this.updateDisplay(this.timer.getState().timeLeft);
  }

  private bindElements(): void {
    // O uso do "as HTMLInputElement" garante tipagem forte no TypeScript
    this.inputMins = document.getElementById("timer-mins") as HTMLInputElement;
    this.inputSecs = document.getElementById("timer-secs") as HTMLInputElement;
    this.btnToggle = document.getElementById("btn-pomo-toggle") as HTMLButtonElement;
    this.btnReset = document.getElementById("btn-reset-pomo") as HTMLButtonElement;
    this.timerWrapper = document.getElementById("timer-wrapper") as HTMLElement;
    this.modeButtons = document.querySelectorAll("[data-pomo-mode]");
  }

  private attachEventListeners(): void {
    this.btnToggle.addEventListener("click", () => this.timer.toggle());
    this.btnReset.addEventListener("click", () => this.timer.reset());

    this.modeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = (e.target as HTMLElement).dataset.pomoMode as PomodoroMode;
        this.timer.setMode(mode);
      });
    });

    const handleTimerEdit = () => {
      const m = parseInt(this.inputMins.value) || 0;
      const s = parseInt(this.inputSecs.value) || 0;
      // Mandamos a intenção para o domínio. Se for inválido, o domínio corrige.
      this.timer.setCustomTime(m, s);
    };

    [this.inputMins, this.inputSecs].forEach((input) => {
      input.addEventListener("focus", () => {
        if (this.timer.getState().isRunning) this.timer.pause();
        input.select();
      });
      input.addEventListener("blur", handleTimerEdit);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });
  }

  // --- MÉTODOS DE ATUALIZAÇÃO DE UI (Chamados pelo Timer) ---

  private updateDisplay(timeLeft: number): void {
    // UX Inteligente: Não atualizamos os inputs se o utilizador estiver a escrever neles
    if (document.activeElement !== this.inputMins && document.activeElement !== this.inputSecs) {
      this.inputMins.value = Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, "0");
      this.inputSecs.value = (timeLeft % 60).toString().padStart(2, "0");
    }
  }

  private updateStateUI(isRunning: boolean, mode: PomodoroMode): void {
    // Atualiza o texto e a classe visual do botão
    this.btnToggle.textContent = isRunning ? "Pausar" : "Iniciar";
    if (isRunning) {
      this.btnToggle.classList.add("running");
    } else {
      this.btnToggle.classList.remove("running");
    }

    // Atualiza as cores globais e a aba ativa
    this.timerWrapper.className = `timer-wrapper mode-${mode === "focus" ? "focus" : "break"}`;
    this.modeButtons.forEach((btn) => btn.classList.remove("active"));

    const activeBtn = document.querySelector(`[data-pomo-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  private onTimerComplete(): void {
    // Aqui enviaríamos uma mensagem para o VS Code (o backend da extensão)
    // Mais tarde podemos criar uma classe VscodeBridge para isolar isto.
    console.log("O tempo acabou!");
    // vscode.postMessage({ command: 'notify', text: 'O tempo acabou!' });
  }
}
