/**
 * 简单的日志工具
 */
export class Logger {
  private context: string;
  
  constructor(context: string = 'Crawler') {
    this.context = context;
  }
  
  info(message: string, ...args: any[]) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
  }
  
  error(message: string, ...args: any[]) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
  }
  
  debug(message: string, ...args: any[]) {
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
  }
}

// 默认导出实例
export const logger = new Logger();