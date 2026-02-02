/**
 * Wraps an async function with basic retry logic
 * @template ReturnType The type returned by the function
 * @param {() => Promise<ReturnType>} fn
 * The async function to execute
 * @param {number[]} retryScheduleMs
 * Array of delays (in ms) between retry attempts
 * @returns {() => Promise<ReturnType>}
 * The result of the async function
 */
export function withRetries(fn, retryScheduleMs = [480, 2400, 12000, 60000, 300000]) {
  return async function () {
    for (const retryDelay of retryScheduleMs) {
      try {
        return await fn();

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Retrying in ${retryDelay}ms after error: ${message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return await fn(); // call again rather than rethrowing err: maintains stack trace
  };
}
