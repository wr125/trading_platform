export const BACKTEST_TIMEFRAMES = {
  H4: '4Hour',
  DAILY: '1Day',
  MONTHLY: '1Month'
} as const

export const TRANSACTION_FEE = 0.001 // 0.1% per trade
export const SLIPPAGE = 0.001 // 0.1% slippage

export const BACKTEST_START_DATE = '2023-01-01'
export const BACKTEST_END_DATE = '2023-12-31'

export type BacktestTimeframe = keyof typeof BACKTEST_TIMEFRAMES 