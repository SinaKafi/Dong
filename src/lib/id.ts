/**
 * Collision-resistant id generator. Uses crypto.randomUUID when available,
 * falls back to a timestamp + random string.
 */
export function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
