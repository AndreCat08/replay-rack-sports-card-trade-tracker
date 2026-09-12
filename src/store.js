import { CONDITIONS, DIRECTIONS } from './types.js';

export const STORAGE_KEY = 'replay_rack_trades_v1';
export const TEXT_LIMITS = Object.freeze({ player: 100, sport: 40, partner: 100 });

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Validates a single trade object
 * @param {unknown} item
 * @returns {import('./types.js').Trade | null}
 */
export function sanitizeTrade(item) {
  if (!item || typeof item !== 'object') return null;
  const t = /** @type {Record<string, unknown>} */ (item);
  if (typeof t.id !== 'string' || !t.id.trim()) return null;
  if (typeof t.player !== 'string' || !t.player.trim() || t.player.trim().length > TEXT_LIMITS.player) return null;
  if (typeof t.sport !== 'string' || !t.sport.trim() || t.sport.trim().length > TEXT_LIMITS.sport) return null;

  const year = Number(t.year);
  if (!Number.isInteger(year) || year < 1850 || year > 2100) return null;

  if (typeof t.condition !== 'string' || !CONDITIONS.includes(/** @type {import('./types.js').CardCondition} */ (t.condition))) return null;
  if (typeof t.partner !== 'string' || !t.partner.trim() || t.partner.trim().length > TEXT_LIMITS.partner) return null;
  if (typeof t.direction !== 'string' || !DIRECTIONS.includes(/** @type {import('./types.js').TradeDirection} */ (t.direction))) return null;
  if (typeof t.date !== 'string' || !isValidDate(t.date)) return null;

  return {
    id: t.id.trim(),
    player: t.player.trim(),
    sport: t.sport.trim(),
    year,
    condition: /** @type {import('./types.js').CardCondition} */ (t.condition),
    partner: t.partner.trim(),
    direction: /** @type {import('./types.js').TradeDirection} */ (t.direction),
    date: /** @type {`${number}-${number}-${number}`} */ (t.date),
      createdAt: typeof t.createdAt === 'number' && Number.isFinite(t.createdAt) ? t.createdAt : Date.now()
  };
}

/**
 * Parse raw storage data defensively
 * @param {string | null} raw
 * @returns {{ trades: import('./types.js').Trade[], corruptCount: number, error: string | null }}
 */
export function parseStoredTrades(raw) {
  if (!raw) {
    return { trades: [], corruptCount: 0, error: null };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { trades: [], corruptCount: 1, error: 'Malformed storage: expected array.' };
    }
    const trades = [];
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
  } catch (err) {
    return { trades: [], corruptCount: 1, error: 'JSON parse failure reading trades.' };
  }
}

/**
 * Computes summary count statistics
 * @param {import('./types.js').Trade[]} trades
 * @returns {import('./types.js').TradeSummary}
 */
export function calculateSummary(trades) {
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
