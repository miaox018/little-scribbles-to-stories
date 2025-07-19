
// Phase 2: Enhanced Error Handling & Recovery System

export interface ErrorContext {
  storyId: string;
  pageNumber: number;
  userId: string;
  operation: string;
  attempt: number;
  timestamp: string;
}

export class StoryProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'StoryProcessingError';
  }
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [2000, 5000, 10000]; // Progressive delays
  
  static isRetryableError(error: any): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /rate.?limit/i,
      /service.?unavailable/i,
      /internal.?server.?error/i,
      /bad.?gateway/i,
      /gateway.?timeout/i,
      /429/,
      /502/,
      /503/,
      /504/
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }
  
  static categorizeError(error: any): { category: string; severity: 'low' | 'medium' | 'high' } {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Network/timeout errors - usually retryable
    if (/timeout|network|connection/i.test(errorMessage)) {
      return { category: 'network', severity: 'medium' };
    }
    
    // Rate limiting - retryable with backoff
    if (/rate.?limit|429/i.test(errorMessage)) {
      return { category: 'rate_limit', severity: 'low' };
    }
    
    // Server errors - potentially retryable
    if (/500|502|503|504|internal.?server/i.test(errorMessage)) {
      return { category: 'server_error', severity: 'high' };
    }
    
    // Authentication/authorization - not retryable
    if (/401|403|unauthorized|forbidden/i.test(errorMessage)) {
      return { category: 'auth_error', severity: 'high' };
    }
    
    // Client errors - usually not retryable
    if (/400|404|invalid|bad.?request/i.test(errorMessage)) {
      return { category: 'client_error', severity: 'medium' };
    }
    
    return { category: 'unknown', severity: 'medium' };
  }
  
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = ErrorHandler.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ERROR-HANDLER] Attempt ${attempt}/${maxRetries} for ${context.operation}`);
        return await operation();
      } catch (error) {
        lastError = error;
        const { category, severity } = ErrorHandler.categorizeError(error);
        
        console.error(`[ERROR-HANDLER] Attempt ${attempt} failed:`, {
          error: error.message,
          category,
          severity,
          context
        });
        
        // Don't retry if it's not a retryable error
        if (!ErrorHandler.isRetryableError(error)) {
          console.log(`[ERROR-HANDLER] Non-retryable error, stopping attempts`);
          throw new StoryProcessingError(
            error.message,
            category,
            false,
            { ...context, attempt }
          );
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Progressive delay with jitter
        const baseDelay = ErrorHandler.RETRY_DELAYS[Math.min(attempt - 1, ErrorHandler.RETRY_DELAYS.length - 1)];
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = baseDelay + jitter;
        
        console.log(`[ERROR-HANDLER] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries exhausted
    const { category } = ErrorHandler.categorizeError(lastError);
    throw new StoryProcessingError(
      `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
      category,
      false,
      { ...context, attempt: maxRetries }
    );
  }
  
  static async logError(error: StoryProcessingError, supabase: any): Promise<void> {
    try {
      // Log detailed error information for debugging
      console.error('[ERROR-HANDLER] Detailed error log:', {
        message: error.message,
        code: error.code,
        retryable: error.retryable,
        context: error.context,
        stack: error.stack
      });
      
      // Update story with error information if context is available
      if (error.context?.storyId) {
        await supabase
          .from('stories')
          .update({
            description: `Error on page ${error.context.pageNumber}: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', error.context.storyId);
      }
    } catch (logError) {
      console.error('[ERROR-HANDLER] Failed to log error:', logError);
    }
  }
}
