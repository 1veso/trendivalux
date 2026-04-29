import { supabase } from './supabase';

// Total slots available per calendar month. Tweak when capacity changes.
export const MAX_SLOTS_PER_MONTH = 4;

// Returns the count of slots left for the current calendar month, derived from
// the orders table. Counts orders that have committed past the unpaid stage.
// Falls back to MAX_SLOTS_PER_MONTH if the query errors so the UI still renders
// scarcity rather than going dark.
export async function getRemainingSlots(): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['paid', 'contract_sent', 'active', 'completed'])
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Scarcity query failed:', error);
    return MAX_SLOTS_PER_MONTH;
  }
  if (count === null) return MAX_SLOTS_PER_MONTH;

  return Math.max(0, MAX_SLOTS_PER_MONTH - count);
}
