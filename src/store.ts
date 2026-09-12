import { CONDITIONS, DIRECTIONS, TEXT_LIMITS } from './types.js';
import type { CardCondition, IsoDate, Trade, TradeDirection, TradeSummary } from './types.js';

export { TEXT_LIMITS };
export const STORAGE_KEY = 'replay_rack_trades_v1';

function isValidDate(value: string): value is IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates and normalizes a single trade object.
 * Returns null when any field is missing, malformed, or out of range.
 */
export function sanitizeTrade(item: unknown): Trade | null {
  if (!item || typeof item !== 'object') return null;
  const t = item as Record<string, unknown>;
  if (typeof t.id !== 'string' || !t.id.trim()) return null;
  if (typeof t.player !== 'string' || !t.player.trim() || t.player.trim().length > TEXT_LIMITS.player) return null;
  if (typeof t.sport !== 'string' || !t.sport.trim() || t.sport.trim().length > TEXT_LIMITS.sport) return null;

  const year = Number(t.year);
  if (!Number.isInteger(year) || year < 1850 || year > 2100) return null;

  if (typeof t.condition !== 'string' || !CONDITIONS.includes(t.condition as CardCondition)) return null;
  if (typeof t.partner !== 'string' || !t.partner.trim() || t.partner.trim().length > TEXT_LIMITS.partner) return null;
  if (typeof t.direction !== 'string' || !DIRECTIONS.includes(t.direction as TradeDirection)) return null;
  if (typeof t.date !== 'string' || !isValidDate(t.date)) return null;

  return {
    id: t.id.trim(),
    player: t.player.trim(),
    sport: t.sport.trim(),
    year,
    condition: t.condition as CardCondition,
    partner: t.partner.trim(),
    direction: t.direction as TradeDirection,
    date: t.date,
    createdAt: typeof t.createdAt === 'number' && Number.isFinite(t.createdAt) ? t.createdAt : Date.now()
  };
}

export interface ParseResult {
  trades: Trade[];
  corruptCount: number;
  error: string | null;
}

/**
 * Parses raw storage data defensively. Never throws.
 * Keeps valid entries and counts skipped ones.
 */
export function parseStoredTrades(raw: string | null): ParseResult {
  if (!raw) {
    return { trades: [], corruptCount: 0, error: null };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { trades: [], corruptCount: 1, error: 'Malformed storage: expected array.' };
    }
    const trades: Trade[] = [];
    let corruptCount = 0;
    for (const item of parsed) {
      const sanitized = sanitizeTrade(item);
      if (sanitized) {
        trades.push(sanitized);
      } else {
        corruptCount++;
      }
    }
    return { trades, corruptCount, error: null };
  } catch {
    return { trades: [], corruptCount: 1, error: 'JSON parse failure reading trades.' };
  }
}

/**
 * Computes summary count statistics.
 */
export function calculateSummary(trades: Trade[]): TradeSummary {
  let sent = 0;
  let received = 0;
  for (const t of trades) {
    if (t.direction === 'Sent') sent++;
    else if (t.direction === 'Received') received++;
  }
  return {
    total: trades.length,
    sent,
    received
  };
}
