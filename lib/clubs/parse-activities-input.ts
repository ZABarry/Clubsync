export function parseActivitiesInput(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatActivitiesInput(activities: string[]): string {
  return activities.join(", ");
}
