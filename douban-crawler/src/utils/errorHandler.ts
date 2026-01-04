export class CrawlerError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
    public context?: any
  ) {
    super(message);
    this.name = 'CrawlerError';
  }
}

export class NetworkError extends CrawlerError {
  constructor(message: string, originalError?: Error, context?: any) {
    super(message, 'NETWORK_ERROR', originalError, context);
    this.name = 'NetworkError';
  }
}

export class ParseError extends CrawlerError {
  constructor(message: string, originalError?: Error, context?: any) {
    super(message, 'PARSE_ERROR', originalError, context);
    this.name = 'ParseError';
  }
}

export class RateLimitError extends CrawlerError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.context = { retryAfter };
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly BACKOFF_MULTIPLIER = 2;
  
  /**
   * 处理错误并决定是否重试
   */
  static async handleError<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 分析错误类型
        const shouldRetry = this.shouldRetry(error as Error, attempt, maxRetries);
        
        if (!shouldRetry) {
          throw this.wrapError(error as Error, context);
        }
        
        // 计算等待时间（指数退避）
        const waitTime = this.calculateBackoffTime(attempt);
        console.warn(`[${context}] 第${attempt}次尝试失败，${waitTime}ms后重试:`, error);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw this.wrapError(lastError!, context);
  }
  
  /**
   * 判断是否应该重试
   */
  private static shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;
    
    const errorMessage = error.message.toLowerCase();
    
    // 网络相关错误可以重试
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('econnrefused')
    ) {
      return true;
    }
    
    // 429 Too Many Requests
    if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
      return true;
    }
    
    // 解析错误通常不重试
    if (errorMessage.includes('parse') || errorMessage.includes('invalid')) {
      return false;
    }
    
    return false;
  }
  
  /**
   * 计算指数退避时间
   */
  private static calculateBackoffTime(attempt: number): number {
    const baseDelay = 1000; // 1秒
    return Math.min(baseDelay * Math.pow(this.BACKOFF_MULTIPLIER, attempt - 1), 30000); // 最大30秒
  }
  
  /**
   * 包装错误，添加上下文
   */
  private static wrapError(error: Error, context: string): CrawlerError {
    if (error instanceof CrawlerError) {
      return error;
    }
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return new NetworkError(`网络错误: ${error.message}`, error, { context });
    }
    
    if (errorMessage.includes('429')) {
      return new RateLimitError('请求过于频繁，请稍后重试');
    }
    
    return new CrawlerError(`[${context}] ${error.message}`, 'UNKNOWN_ERROR', error, { context });
  }
  
  /**
   * 记录错误到日志文件
   */
  static logError(error: CrawlerError, additionalInfo?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        context: error.context,
      },
      additionalInfo,
    };
    
    console.error('🚨 错误详情:', JSON.stringify(logEntry, null, 2));
    
    // 可以在这里添加写入日志文件的逻辑
    // fs.writeFileSync('error_log.json', JSON.stringify(logEntry, null, 2));
  }
}