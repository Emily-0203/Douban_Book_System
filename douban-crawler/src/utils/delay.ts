/**
 * 延时函数，用于控制爬虫请求频率，避免被封IP
 * @param minMs 最小延时毫秒数
 * @param maxMs 最大延时毫秒数
 * @returns Promise<void>
 */
export function delay(minMs: number, maxMs?: number): Promise<void> {
  const ms = maxMs 
    ? Math.floor(Math.random() * (maxMs - minMs)) + minMs
    : minMs;
  
  return new Promise(resolve => {
    console.log(`等待 ${ms}ms...`);
    setTimeout(resolve, ms);
  });
}

/**
 * 固定延时
 */
export function fixedDelay(ms: number): Promise<void> {
  return delay(ms, ms);
}