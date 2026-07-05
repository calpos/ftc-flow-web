/** Generate a reasonably unique id with a readable prefix. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
