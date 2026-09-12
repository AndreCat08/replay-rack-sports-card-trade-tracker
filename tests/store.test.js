import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTrade, parseStoredTrades, calculateSummary } from '../dist/store.js';

test('sanitizeTrade valid entry', () => {
  const valid = {
    id: 't-123',
    player: 'Michael Jordan',
    sport: 'Basketball',
    year: 1986,
    condition: 'Mint',
    partner: 'Dave',
    direction: 'Sent',
    date: '2024-05-12'
  };
  const sanitized = sanitizeTrade(valid);
  assert.ok(sanitized);
  assert.equal(sanitized.player, 'Michael Jordan');
  assert.equal(sanitized.year, 1986);
  assert.equal(sanitized.direction, 'Sent');
  assert.equal(sanitized.condition, 'Mint');
});

test('sanitizeTrade rejects invalid values', () => {
  assert.equal(sanitizeTrade(null), null);
  assert.equal(sanitizeTrade({ id: '1', player: '', sport: 'Card' }), null);
  assert.equal(sanitizeTrade({ id: '1', player: 'P', sport: 'S', year: 1700 }), null);
  assert.equal(sanitizeTrade({ id: '1', player: 'P', sport: 'S', year: 2020, condition: 'Damaged' }), null);
  assert.equal(sanitizeTrade({ id: '1', player: 'P', sport: 'S', year: 2020, condition: 'Mint', direction: 'Lost' }), null);
});

test('sanitizeTrade rejects invalid calendar dates and oversized text', () => {
  const valid = {
    id: 't-123',
    player: 'Michael Jordan',
    sport: 'Basketball',
    year: 1986,
    condition: 'Mint',
    partner: 'Dave',
    direction: 'Sent',
    date: '2024-05-12'
  };

  assert.equal(sanitizeTrade({ ...valid, date: '2024-02-31' }), null);
  assert.equal(sanitizeTrade({ ...valid, date: '2024-13-01' }), null);
  assert.equal(sanitizeTrade({ ...valid, player: 'x'.repeat(101) }), null);
  assert.equal(sanitizeTrade({ ...valid, sport: 'x'.repeat(41) }), null);
  assert.equal(sanitizeTrade({ ...valid, partner: 'x'.repeat(101) }), null);
});

test('sanitizeTrade replaces non-finite createdAt values', () => {
  const valid = {
    id: 't-123',
    player: 'Michael Jordan',
    sport: 'Basketball',
    year: 1986,
    condition: 'Mint',
    partner: 'Dave',
    direction: 'Sent',
    date: '2024-05-12'
  };

  assert.ok(Number.isFinite(sanitizeTrade({ ...valid, createdAt: NaN })?.createdAt));
  assert.ok(Number.isFinite(sanitizeTrade({ ...valid, createdAt: Infinity })?.createdAt));
});

test('parseStoredTrades defensive recovery', () => {
  const rawEmpty = parseStoredTrades(null);
  assert.equal(rawEmpty.trades.length, 0);
  assert.equal(rawEmpty.corruptCount, 0);

  const rawCorruptJson = parseStoredTrades('invalid json');
  assert.equal(rawCorruptJson.trades.length, 0);
  assert.equal(rawCorruptJson.corruptCount, 1);
  assert.ok(rawCorruptJson.error);

  const mixedData = JSON.stringify([
    { id: '1', player: 'Ken Griffey Jr', sport: 'Baseball', year: 1989, condition: 'Near Mint', partner: 'Alice', direction: 'Received', date: '2023-01-01' },
    { id: 'bad', player: '' }
  ]);
  const parsed = parseStoredTrades(mixedData);
  assert.equal(parsed.trades.length, 1);
  assert.equal(parsed.corruptCount, 1);
  assert.equal(parsed.trades[0].player, 'Ken Griffey Jr');
});

test('calculateSummary counts correctly', () => {
  /** @type {import('../dist/types.js').Trade[]} */
  const trades = [
    { id: '1', player: 'A', sport: 'B', year: 2000, condition: 'Mint', partner: 'X', direction: 'Sent', date: '2020-01-01', createdAt: 1 },
    { id: '2', player: 'C', sport: 'D', year: 2001, condition: 'Good', partner: 'Y', direction: 'Received', date: '2020-01-02', createdAt: 2 },
    { id: '3', player: 'E', sport: 'F', year: 2002, condition: 'Fair', partner: 'Z', direction: 'Sent', date: '2020-01-03', createdAt: 3 }
  ];
  const summary = calculateSummary(trades);
  assert.deepEqual(summary, {
    total: 3,
    sent: 2,
    received: 1
  });
});
