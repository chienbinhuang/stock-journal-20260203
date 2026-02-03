import { TradePhase } from "./types";

export const FEE_RATE = 0.001425;
export const FEE_DISCOUNT = 0.3;
export const TAX_RATE_STOCK = 0.003;
export const TAX_RATE_ETF = 0.001;

export const PHASE_OPTIONS: { value: TradePhase; label: string }[] = [
  { value: 'TRIAL', label: '試錯期' },
  { value: 'TREND', label: '順勢期' },
  { value: 'DRAWDOWN', label: '回撤期' },
];

export const INITIAL_CAPITAL_DEFAULT = 1000000;
