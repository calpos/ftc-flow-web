export function saveWithWarning(label: string, save: Promise<void>): void {
  void save.catch((error) => {
    console.warn(`Failed to persist ${label}:`, error);
  });
}
