
// Phase 2: Circuit Breaker Pattern for OpenAI API

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30000, // 30 seconds
    private successThreshold = 2
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      } else {
        this.state = 'HALF_OPEN';
        console.log('[CIRCUIT-BREAKER] Moving to HALF_OPEN state');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('[CIRCUIT-BREAKER] Moving to CLOSED state after success');
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`[CIRCUIT-BREAKER] Moving to OPEN state after ${this.failureCount} failures`);
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
    console.log('[CIRCUIT-BREAKER] Circuit breaker reset');
  }
}

// Global circuit breaker instance for OpenAI API
export const openaiCircuitBreaker = new CircuitBreaker(3, 60000, 1); // More conservative settings
