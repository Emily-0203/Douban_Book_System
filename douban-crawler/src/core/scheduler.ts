import { delay } from '../utils/delay';
import { config } from '../config';
import { logger } from '../utils/logger';  // 添加导入
/**
 * 请求任务
 */
export interface RequestTask {
  url: string;
  retryCount?: number;
  priority?: number;
}

/**
 * 请求调度器（控制并发和速率）
 */
export class RequestScheduler {
  private maxConcurrent: number;
  private delayRange: [number, number];
  private activeRequests: number = 0;
  private queue: RequestTask[] = [];
  private processing: Set<string> = new Set();
  
  constructor(maxConcurrent?: number, delayRange?: [number, number]) {
    this.maxConcurrent = maxConcurrent || config.maxConcurrent;
    this.delayRange = delayRange || config.delayRange;
  }

 


  
  /**
   * 添加请求任务到队列
   */
  addTask(task: RequestTask | string): void {
    const requestTask: RequestTask = typeof task === 'string' 
      ? { url: task, retryCount: 0, priority: 0 }
      : task;
    
    this.queue.push(requestTask);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0)); // 按优先级排序
  }
  
  /**
   * 批量添加任务
   */
  addTasks(tasks: (RequestTask | string)[]): void {
    tasks.forEach(task => this.addTask(task));
  }
  
 /**
   * 执行单个请求
   */
  async execute<T>(
    task: RequestTask,
    handler: (url: string) => Promise<T>
  ): Promise<T> {
    this.activeRequests++;
    this.processing.add(task.url);
    
    try {
      logger.debug(`开始请求: ${task.url} (活跃请求: ${this.activeRequests})`);
      
      // 随机延时，模拟人类行为
      await delay(this.delayRange[0], this.delayRange[1]);
      
      const result = await handler(task.url);
      
      logger.debug(`请求成功: ${task.url}`);
      return result;
      
    } catch (error: any) {
      logger.error(`请求失败: ${task.url} - ${error.message}`);
      
      // 重试逻辑（最多重试2次）
      if ((task.retryCount || 0) < 2) {
        logger.info(`准备重试: ${task.url} (第${(task.retryCount || 0) + 1}次)`);
        const retryTask: RequestTask = {
          ...task,
          retryCount: (task.retryCount || 0) + 1,
          priority: (task.priority || 0) + 1
        };
        
        // 延时后重试
        setTimeout(() => {
          this.addTask(retryTask);
          this.processQueue(handler);
        }, 3000);
        
        throw error;
      } else {
        logger.error(`放弃重试: ${task.url} (已达最大重试次数)`);
        throw error;
      }
    } finally {
      this.activeRequests--;
      this.processing.delete(task.url);
      this.processQueue(handler);
    }
  }
  
  /**
   * 处理队列
   */
  private async processQueue<T>(handler: (url: string) => Promise<T>): Promise<void> {
    // 检查是否可以开始新请求
    if (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!;
      
      // 检查是否正在处理相同的URL
      if (this.processing.has(task.url)) {
        console.log(`跳过重复请求: ${task.url}`);
        this.processQueue(handler);
        return;
      }
      
      // 执行请求
      this.execute(task, handler).catch(error => {
        // 错误已经在execute方法中处理
        console.error(`队列任务执行失败: ${task.url}`, error.message);
      });
    }
  }
  
  /**
   * 开始处理所有任务
   */
  async start<T>(
    handler: (url: string) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (this.activeRequests === 0 && this.queue.length === 0) {
          resolve(results);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      
      // 开始处理队列
      this.processQueue(async (url: string) => {
        try {
          const result = await handler(url);
          results.push(result);
          return result;
        } catch (error) {
          throw error;
        }
      });
      
      // 定期检查是否完成
      checkCompletion();
    });
  }
  
  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    };
  }
  
  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = [];
    console.log('请求队列已清空');
  }
}

export const requestScheduler = new RequestScheduler();