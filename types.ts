export type TradeType = 'BUY' | 'SELL';
export type TradePhase = 'TRIAL' | 'TREND' | 'DRAWDOWN'; // 試錯期、順勢期、回撤期

export interface Trade {
  id: string;
  stockCode: string;
  date: string; // YYYY-MM-DD
  type: TradeType;
  price: number;
  shares: number;
  isETF: boolean;
  phase: TradePhase;
  note: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  stockCode: string; // Optional, can be general
  date: string;
  content: string;
  timestamp: number;
}

export interface ClosedTrade {
  stockCode: string;
  entryDate: string;
  exitDate: string;
  buyCost: number; // Includes buy fee
  sellRevenue: number; // After sell fee & tax
  realizedPL: number;
  roi: number;
  holdingDays: number;
  phase: TradePhase;
}

export interface OpenPosition {
  stockCode: string;
  shares: number;
  avgCost: number; // Average cost per share including fees
  totalCost: number;
  firstBuyDate: string;
  isETF: boolean;
}

export interface StockSummary {
  stockCode: string;
  sharesHeld: number;
  totalInvestedCost: number; // Current inventory cost
  realizedPL: number;
  realizedROI: number; // Average ROI of closed trades
  avgHoldingDays: number;
  annualizedROI: number;
  allocationPercent: number; // % of Total Capital
  currentPrice: number; // User manually updates or uses last trade price
  unrealizedPL: number; // Floating P&L
}

export interface PortfolioStats {
  totalCapital: number;
  totalMarketValue: number; // Cash + Stock Market Value
  cashBalance: number;
  totalInvested: number;
  floatingPL: number;
  realizedCumulativePL: number;
  totalROI_YTD: number;
  totalROI_AllTime: number;
  maxDrawdown: number;
  winRate: number;
  avgWinLossRatio: number;
  tradeCount: number;
}

export interface AppState {
  totalCapital: number; // Initial/Adjustable funding
  trades: Trade[];
  journalEntries: JournalEntry[];
  currentPrices: Record<string, number>; // Manual price overrides map
}