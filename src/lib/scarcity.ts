// Only paid orders reserve capacity. Customer order data stays server-side.
export async function getRemainingSlots(): Promise<number | null> {
  try {
    const response = await fetch('/api/availability');
    if (!response.ok) return null;
    const data = await response.json() as { remaining?: unknown };
    return typeof data.remaining === 'number' && Number.isInteger(data.remaining) && data.remaining >= 0 ? data.remaining : null;
  } catch { return null; }
}
