/**
 * Run some initialize code at a proper time.
 */
export function init(fn: () => void, onlyOnTarget?: string): void {
  if (process.env.DO_INIT === 'FALSE') return;

  if (
    onlyOnTarget &&
    process.env.FUNCTION_TARGET &&
    process.env.FUNCTION_TARGET !== onlyOnTarget
  )
    return;

  setTimeout(fn, 0);
}

export default init;
