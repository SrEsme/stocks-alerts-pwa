export interface Alert {
  id: string;
  ticker: string;
  price: number;
  typeOfAlert: 'ge' | 'le'; // greater or equal / less or equal
  status: 'active' | 'triggered';
  assetType?: 'stock' | 'crypto'; // defaults to 'stock' for backward compat
  createdAt: Date;
  triggeredAt?: Date;
  triggeredPrice?: number;
  userId?: string;
  note?: string; // Optional note shown when editing and in Telegram notifications
}

export interface StockQuote {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  entryPrice: number;        // Target buy price
  targetPrice: number;       // Target sell price
  thesis: string;            // Investment thesis/idea
  imageUrl?: string;         // Optional image URL
  order: number;             // For drag-and-drop ordering
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
