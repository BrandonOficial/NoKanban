export type PomodoroMode = "focus" | "short" | "long";

// Evitar os "Magic Numbers" espalhados pelo código
interface PomodoroConfig {
  focus: number;
  short: number;
  long: number;
}

const DEFAULT_TIMES: PomodoroConfig = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export class PomodoroTimer {
  private timeLeft: number;
  private intervalId: number | null = null;
  private mode: PomodoroMode = "focus";
  private isRunning: boolean = false;

  /**
   * Injeção de Dependência (DIP) via callbacks.
   * O Timer não altera a UI. Ele "grita" o que aconteceu,
   * e quem o instanciou que se vire para atualizar a interface.
   */
  constructor(
    private readonly onTick: (timeLeft: number) => void,
    private readonly onStateChange: (isRunning: boolean, mode: PomodoroMode) => void,
    private readonly onComplete: () => void,
  ) {
    this.timeLeft = DEFAULT_TIMES[this.mode];
  }

  public toggle(): void {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.onStateChange(this.isRunning, this.mode);

    this.intervalId = window.setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.onTick(this.timeLeft);
      } else {
        this.complete();
      }
    }, 1000);
  }

  public pause(): void {
    if (!this.isRunning) return;

    this.clearTimer();
    this.isRunning = false;
    this.onStateChange(this.isRunning, this.mode);
  }

  public reset(): void {
    this.pause();
    this.timeLeft = DEFAULT_TIMES[this.mode];
    this.onTick(this.timeLeft);
  }

  public setMode(newMode: PomodoroMode): void {
    this.pause();
    this.mode = newMode;
    this.timeLeft = DEFAULT_TIMES[this.mode];
    this.onStateChange(this.isRunning, this.mode);
    this.onTick(this.timeLeft);
  }

  /**
   * Validação de domínio: não permite tempos negativos ou absurdos.
   */
  public setCustomTime(minutes: number, seconds: number): void {
    this.pause();

    let m = Math.max(0, minutes);
    let s = Math.max(0, Math.min(59, seconds));

    // Regra de negócio: um Pomodoro não pode ter zero segundos no total
    if (m === 0 && s === 0) {
      m = 1;
    }

    this.timeLeft = m * 60 + s;
    this.onTick(this.timeLeft);
  }

  private complete(): void {
    this.pause();
    this.reset();
    this.onComplete();
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Permite consultar o estado atual sem violar o encapsulamento (variáveis privadas)
  public getState() {
    return {
      timeLeft: this.timeLeft,
      isRunning: this.isRunning,
      mode: this.mode,
    };
  }
}
