// Phase 1 optimization: Performance tracking utilities

export class PerformanceTracker {
  private startTime: number;
  private checkpoints: { [key: string]: number } = {};
  
  constructor() {
    this.startTime = Date.now();
  }
  
  checkpoint(name: string): void {
    this.checkpoints[name] = Date.now() - this.startTime;
    console.log(`[PERF] Checkpoint "${name}": ${this.checkpoints[name]}ms`);
  }
  
  getElapsed(): number {
    return Date.now() - this.startTime;
  }
  
  getSummary(): string {
    const total = this.getElapsed();
    const checkpointSummary = Object.entries(this.checkpoints)
      .map(([name, time]) => `${name}: ${time}ms (${((time / total) * 100).toFixed(1)}%)`)
      .join(', ');
    
    return `Total: ${total}ms | ${checkpointSummary}`;
  }
  
  logSummary(): void {
    console.log(`[PERF] Processing Summary: ${this.getSummary()}`);
  }
}