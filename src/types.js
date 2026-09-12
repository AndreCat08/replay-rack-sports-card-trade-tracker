/**
 * @typedef {'Mint' | 'Near Mint' | 'Good' | 'Fair'} CardCondition
 * @typedef {'Sent' | 'Received'} TradeDirection
 * 
 * @typedef {Object} Trade
 * @property {string} id
 * @property {string} player
 * @property {string} sport
 * @property {number} year
 * @property {CardCondition} condition
 * @property {string} partner
 * @property {TradeDirection} direction
 * @property {`${number}-${number}-${number}`} date
 * @property {number} createdAt
 * 
 * @typedef {Object} TradeSummary
 * @property {number} total
 * @property {number} sent
 * @property {number} received
 */

export const CONDITIONS = /** @type {const} */ (['Mint', 'Near Mint', 'Good', 'Fair']);
export const DIRECTIONS = /** @type {const} */ (['Sent', 'Received']);
