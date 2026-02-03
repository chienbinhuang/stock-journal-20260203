import { Trade, ClosedTrade, OpenPosition, StockSummary, PortfolioStats } from "../types";
import { FEE_RATE, FEE_DISCOUNT, TAX_RATE_STOCK, TAX_RATE_ETF } from "../constants";

// Helper to calculate transaction costs
const calculateCost = (price: number, shares: number, type: 'BUY' | 'SELL', isETF: boolean) => {
  const value = price * shares;
  const fee = Math.floor(value * FEE_RATE * FEE_DISCOUNT); // Taiwan fee is usually floored
  const tax = type === 'SELL' ? Math.floor(value * (isETF ? TAX_RATE_ETF : TAX_RATE_STOCK)) : 0;
  return { value, fee, tax, total: type === 'BUY' ? value + fee : value - fee - tax };
};

export const calculatePortfolio = (
  initialCapital: number,
  trades: Trade[],
  currentPrices: Record<string, number>
): {
  stats: PortfolioStats;
  stockSummaries: StockSummary[];
} => {
  // Sort trades by date, then timestamp
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  const openPositions: Record<string, OpenPosition> = {};
  const closedTrades: ClosedTrade[] = [];
  const inventoryQueue: Record<string, { price: number; shares: number; date: string; feePerShare: number }[]> = {};
  
  // Realized P&L Tracker by Stock
  const stockRealizedData: Record<string, { totalPL: number; roiSum: number; count: number; totalDays: number }> = {};

  // Process Trades (FIFO)
  sortedTrades.forEach(trade => {
    if (!inventoryQueue[trade.stockCode]) inventoryQueue[trade.stockCode] = [];
    if (!stockRealizedData[trade.stockCode]) stockRealizedData[trade.stockCode] = { totalPL: 0, roiSum: 0, count: 0, totalDays: 0 };

    const { fee, tax } = calculateCost(trade.price, trade.shares, trade.type, trade.isETF);

    if (trade.type === 'BUY') {
      const feePerShare = fee / trade.shares;
      inventoryQueue[trade.stockCode].push({
        price: trade.price,
        shares: trade.shares,
        date: trade.date,
        feePerShare
      });

      // Update Open Position Summary
      const currentPos = openPositions[trade.stockCode] || { 
        stockCode: trade.stockCode, shares: 0, avgCost: 0, totalCost: 0, firstBuyDate: trade.date, isETF: trade.isETF 
      };
      
      const newTotalCost = currentPos.totalCost + (trade.price * trade.shares) + fee;
      const newShares = currentPos.shares + trade.shares;
      
      openPositions[trade.stockCode] = {
        ...currentPos,
        shares: newShares,
        totalCost: newTotalCost,
        avgCost: newTotalCost / newShares,
        isETF: trade.isETF
      };

    } else {
      // SELL Logic (FIFO)
      let sharesToSell = trade.shares;
      let costBasis = 0;
      let earliestDate = trade.date;

      while (sharesToSell > 0 && inventoryQueue[trade.stockCode].length > 0) {
        const batch = inventoryQueue[trade.stockCode][0];
        const taken = Math.min(sharesToSell, batch.shares);
        
        costBasis += (batch.price * taken) + (batch.feePerShare * taken);
        earliestDate = batch.date; // Approximation: use oldest date for holding period of this batch
        
        batch.shares -= taken;
        sharesToSell -= taken;

        if (batch.shares === 0) {
          inventoryQueue[trade.stockCode].shift();
        }
      }

      // Calculate Realized for this chunk
      const revenue = (trade.price * trade.shares) - fee - tax;
      const realizedPL = revenue - costBasis;
      const roi = costBasis > 0 ? realizedPL / costBasis : 0;
      
      // Holding Days
      const entryTime = new Date(earliestDate).getTime();
      const exitTime = new Date(trade.date).getTime();
      const holdingDays = Math.max(1, (exitTime - entryTime) / (1000 * 3600 * 24));

      closedTrades.push({
        stockCode: trade.stockCode,
        entryDate: earliestDate,
        exitDate: trade.date,
        buyCost: costBasis,
        sellRevenue: revenue,
        realizedPL,
        roi,
        holdingDays,
        phase: trade.phase
      });

      // Update Stock Summary Accumulators
      stockRealizedData[trade.stockCode].totalPL += realizedPL;
      stockRealizedData[trade.stockCode].roiSum += roi;
      stockRealizedData[trade.stockCode].count += 1;
      stockRealizedData[trade.stockCode].totalDays += holdingDays;

      // Update Open Position Summary
      const currentPos = openPositions[trade.stockCode];
      if (currentPos) {
        const remainingShares = currentPos.shares - trade.shares;
        if (remainingShares <= 0) {
            delete openPositions[trade.stockCode];
        } else {
            // Pro-rate the cost reduction
            const costRemoved = (currentPos.totalCost / currentPos.shares) * trade.shares; 
            // *Note: This is Avg Cost method for "Remaining Open", but realized is FIFO. 
            // For display simplicity, we keep Avg Cost for remaining view.
             openPositions[trade.stockCode] = {
                ...currentPos,
                shares: remainingShares,
                totalCost: currentPos.totalCost - costRemoved
            };
        }
      }
    }
  });

  // Compile Stock Summaries
  const stockSummaries: StockSummary[] = Object.keys({ ...openPositions, ...stockRealizedData }).map(code => {
    const pos = openPositions[code];
    const realized = stockRealizedData[code] || { totalPL: 0, roiSum: 0, count: 0, totalDays: 0 };
    
    // Determine Current Price: Manual override > Last Trade Price > Avg Cost
    let currentPrice = currentPrices[code];
    if (!currentPrice) {
        // Find last trade for this stock
        const lastTrade = [...trades].reverse().find(t => t.stockCode === code);
        currentPrice = lastTrade ? lastTrade.price : (pos ? pos.avgCost : 0);
    }

    const sharesHeld = pos ? pos.shares : 0;
    const totalInvestedCost = pos ? pos.totalCost : 0;
    const marketValue = sharesHeld * currentPrice;
    
    // Estimated Sell Fee/Tax for Unrealized
    const estSellFee = Math.floor(marketValue * FEE_RATE * FEE_DISCOUNT);
    const estSellTax = Math.floor(marketValue * (pos?.isETF ? TAX_RATE_ETF : TAX_RATE_STOCK));
    const unrealizedPL = sharesHeld > 0 ? (marketValue - estSellFee - estSellTax) - totalInvestedCost : 0;

    const realizedROI = realized.count > 0 ? realized.roiSum / realized.count : 0;
    const avgHoldingDays = realized.count > 0 ? realized.totalDays / realized.count : 0;
    
    // Simple annualized: Total Realized ROI adjusted by avg days? Or just sum of annualized trades.
    // Let's use: (1 + RealizedROI)^(365/AvgDays) - 1
    const annualizedROI = realized.count > 0 && avgHoldingDays > 0 
        ? (Math.pow(1 + realizedROI, 365 / Math.max(avgHoldingDays, 1)) - 1)
        : 0;

    return {
      stockCode: code,
      sharesHeld,
      totalInvestedCost,
      realizedPL: realized.totalPL,
      realizedROI,
      avgHoldingDays,
      annualizedROI,
      allocationPercent: 0, // Calculated later
      currentPrice,
      unrealizedPL
    };
  });

  // Calculate Portfolio Stats
  let totalInvested = 0;
  let totalUnrealizedPL = 0;
  let totalRealizedPL = 0;

  stockSummaries.forEach(s => {
    totalInvested += s.totalInvestedCost;
    totalUnrealizedPL += s.unrealizedPL;
    totalRealizedPL += s.realizedPL;
    s.allocationPercent = initialCapital > 0 ? (s.totalInvestedCost / initialCapital) * 100 : 0;
  });

  // Calculate cash from trades strictly
  let cash = initialCapital;
  sortedTrades.forEach(t => {
     const { total } = calculateCost(t.price, t.shares, t.type, t.isETF);
     if (t.type === 'BUY') cash -= total; // Cost includes fee
     else cash += total; // Revenue is net of fee/tax
  });

  const totalMarketValue = cash + stockSummaries.reduce((sum, s) => sum + (s.sharesHeld * s.currentPrice), 0);
  
  // Win Rate & Stats
  const winningTrades = closedTrades.filter(t => t.realizedPL > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const avgWin = winningTrades.reduce((sum, t) => sum + t.realizedPL, 0) / (winningTrades.length || 1);
  const losingTrades = closedTrades.filter(t => t.realizedPL <= 0);
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPL, 0) / (losingTrades.length || 1));
  const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 100 : 0;

  // Max Drawdown (Simplified based on Realized Equity Curve)
  let peakEquity = initialCapital;
  let maxDD = 0;
  
  // Replay trades for equity curve (approximated by realized events)
  let runningRealized = 0;
  closedTrades.forEach(t => {
      runningRealized += t.realizedPL;
      const equity = initialCapital + runningRealized;
      if (equity > peakEquity) peakEquity = equity;
      const dd = (peakEquity - equity) / peakEquity;
      if (dd > maxDD) maxDD = dd;
  });

  // Total ROI
  const totalROI_AllTime = initialCapital > 0 ? ((totalMarketValue - initialCapital) / initialCapital) * 100 : 0;
  
  // YTD (Filter closed trades by current year)
  const currentYear = new Date().getFullYear();
  const ytdPL = closedTrades
    .filter(t => new Date(t.exitDate).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.realizedPL, 0) + totalUnrealizedPL; // Include floating in YTD? Usually yes.
  
  const totalROI_YTD = initialCapital > 0 ? (ytdPL / initialCapital) * 100 : 0;


  return {
    stats: {
      totalCapital: initialCapital,
      totalMarketValue,
      cashBalance: cash,
      totalInvested,
      floatingPL: totalUnrealizedPL,
      realizedCumulativePL: totalRealizedPL,
      totalROI_YTD,
      totalROI_AllTime,
      maxDrawdown: maxDD * 100,
      winRate,
      avgWinLossRatio,
      tradeCount: trades.length
    },
    stockSummaries
  };
};