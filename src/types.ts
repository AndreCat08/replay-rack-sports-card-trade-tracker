export type CardCondition = 'Mint' | 'Near Mint' | 'Good' | 'Fair';
export type TradeDirection = 'Sent' | 'Received';
export type IsoDate = `${number}-${number}-${number}`;

export interface Trade {
  id: string;
  player: string;
  sport: string;
  year: number;
  condition: CardCondition;
  partner: string;
  direction: TradeDirection;
  date: IsoDate;
  createdAt: number;
}

export interface TradeSummary {
  total: number;
  sent: number;
  received: number;
}

export const CONDITIONS = ['Mint', 'Near Mint', 'Good', 'Fair'] as const satisfies readonly CardCondition[];
export const DIRECTIONS = ['Sent', 'Received'] as const satisfies readonly TradeDirection[];
export const TEXT_LIMITS = Object.freeze({ player: 100, sport: 40, partner: 100 });
