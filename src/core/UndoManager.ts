export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  getName(): string;
}

export class UndoManager {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistory = 100;

  execute(command: Command): void {
    // Supprime les commandes futures si on est revenu en arrière
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    command.execute();
    this.history.push(command);
    this.currentIndex++;

    // Limiter la taille de l'historique
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): void {
    if (this.canUndo()) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.redo();
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
