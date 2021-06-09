/**
 * Run some initialize code at a proper time.
 */
export function init(fn: () => void): void {
  if (process.env.DO_INIT !== 'FALSE') {
    setTimeout(fn, 0);
  }
}

export default init;
