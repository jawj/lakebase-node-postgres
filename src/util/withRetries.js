/**
 * Wraps an async function with basic retry logic
 * @template ReturnType The type returned by the async function
 * @param {() => Promise<ReturnType>} asyncFn
 * The async function to execute
 * @param {number[]} retrySchedule
 * Array of delays (in ms) between retry attempts
 * @returns {() => Promise<ReturnType>}
 * The result of the async function
 */
export function withRetries(asyncFn, retrySchedule = [480, 2400, 12000, 60000, 300000]) {
  return async function () {
    for (const retryDelay of retrySchedule) {
      try {
        return await asyncFn();

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Retrying in ${retryDelay}ms after error: ${message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return await asyncFn(); // call again rather than rethrowing err to maintain stack trace
  };
}
