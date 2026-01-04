"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.fixedDelay = fixedDelay;
/**
 * 延时函数，用于控制爬虫请求频率，避免被封IP
 * @param minMs 最小延时毫秒数
 * @param maxMs 最大延时毫秒数
 * @returns Promise<void>
 */
function delay(minMs, maxMs) {
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
function fixedDelay(ms) {
    return delay(ms, ms);
}
