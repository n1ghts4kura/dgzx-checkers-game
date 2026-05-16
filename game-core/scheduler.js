// ==========================================
// 协作调度工具 — 时间预算让步，平台无关
// ==========================================

/**
 * 创建一个协作调度器，每 timeSliceMs 毫秒向事件循环让步一次。
 *
 * 用法:
 *   const sched = createScheduler(120);
 *   while (workRemaining) {
 *     await sched.yieldIfNeeded();
 *     doWork();
 *   }
 *
 * @param {number} timeSliceMs - 最大连续计算时间 (默认 120ms)
 * @returns {{ yieldIfNeeded: () => Promise<void>, reset: () => void }}
 */
export function createScheduler(timeSliceMs = 120) {
  let deadline = Date.now() + timeSliceMs

  return {
    async yieldIfNeeded() {
      if (Date.now() > deadline) {
        await new Promise(resolve => setTimeout(resolve, 0))
        deadline = Date.now() + timeSliceMs
      }
    },
    reset() {
      deadline = Date.now() + timeSliceMs
    }
  }
}
