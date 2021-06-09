export class ConfigError extends Error {}

export function required(
  value: string | undefined | null,
  name: string,
): string {
  if (process.env.DO_INIT === 'FALSE') return '';
  if (!value) {
    const message = `The required ${name} is not set.`;
    console.error(`Error: ${message}`);
    throw new ConfigError(message);
  }

  return value;
}

export default required;
