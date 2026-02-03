import { AppState, Trade, JournalEntry, PortfolioStats, StockSummary } from "../types";

export const exportDataToCSV = (
  state: AppState,
  stats?: PortfolioStats,
  summaries?: StockSummary[]
) => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filename = `股票交易記錄-${dateStr}.csv`;
  const BOM = "\uFEFF"; // Byte Order Mark for Excel/Numbers to read UTF-8 correctly
  let csvContent = BOM;

  // 1. Portfolio Stats Section
  if (stats) {
    csvContent += "【帳戶整體績效】\n";
    csvContent += "項目,數值\n";
    csvContent += `總資金水位,${stats.totalCapital}\n`;
    csvContent += `當前總資產,${stats.totalMarketValue}\n`;
    csvContent += `現金餘額,${stats.cashBalance}\n`;
    csvContent += `浮動盈虧,${stats.floatingPL}\n`;
    csvContent += `已實現累積盈虧,${stats.realizedCumulativePL}\n`;
    csvContent += `年度總報酬率,${stats.totalROI_YTD}%\n`;
    csvContent += `歷史總報酬率,${stats.totalROI_AllTime}%\n`;
    csvContent += `最大回撤,${stats.maxDrawdown}%\n`;
    csvContent += `勝率,${stats.winRate}%\n`;
    csvContent += `盈虧比,${stats.avgWinLossRatio}\n\n`;
  }

  // 2. Stock Summary Section
  if (summaries && summaries.length > 0) {
    csvContent += "【個股績效表現】\n";
    csvContent += "代號,庫存股數,總投入成本,現價,浮動盈虧,已實現損益,已實現ROI%,資金佔比%,平均持有天數,年化報酬率%\n";
    summaries.forEach(s => {
      const row = [
        s.stockCode,
        s.sharesHeld,
        s.totalInvestedCost,
        s.currentPrice,
        s.unrealizedPL,
        s.realizedPL,
        (s.realizedROI * 100).toFixed(2),
        s.allocationPercent.toFixed(2),
        s.avgHoldingDays.toFixed(1),
        (s.annualizedROI * 100).toFixed(2)
      ].join(",");
      csvContent += row + "\n";
    });
    csvContent += "\n";
  }

  // 3. Trade Records Section (The core data for import)
  csvContent += "【交易記錄明細】\n";
  // Added TYPE, PRICE, SHARES, PHASE, NOTE explicitly
  csvContent += "RecordType,ID,Type,StockCode,Date,Price,Shares,IsETF,Phase,Note,Timestamp\n";

  state.trades.forEach(t => {
    const row = [
      "TRADE",
      t.id,
      t.type,
      t.stockCode,
      t.date,
      t.price,
      t.shares,
      t.isETF ? "TRUE" : "FALSE",
      t.phase,
      (t.note || "").replace(/"/g, '""'), // Escape quotes in notes
      t.timestamp
    ].map(item => `"${item}"`).join(",");
    csvContent += row + "\n";
  });
  csvContent += "\n";

  // 4. Journal Entries
  csvContent += "【覆盤筆記】\n";
  csvContent += "RecordType,ID,Date,StockCode,Content,Timestamp\n";
  state.journalEntries.forEach(j => {
    const row = [
      "JOURNAL",
      j.id,
      j.date,
      j.stockCode || "",
      (j.content || "").replace(/"/g, '""'),
      j.timestamp
    ].map(item => `"${item}"`).join(",");
    csvContent += row + "\n";
  });
  
  // 5. Config (Capital) - Append at end for restore
  csvContent += `\nCAPITAL,CONFIG,${state.totalCapital},,,,,,,,\n`;

  // Create Download Link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSVImport = (file: File): Promise<Partial<AppState>> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (!text) return resolve({});

      // Remove BOM if present (Excel/Numbers often add this)
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      // Robust CSV Parser that handles multiline quoted fields
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Handle escaped quotes: "Text ""Quote"" Here" -> Text "Quote" Here
            currentField += '"';
            i++; // Skip the next quote
          } else {
            // Toggle quote boundary
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field delimiter
          currentRow.push(currentField);
          currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
           // Row delimiter
           if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
           
           if (currentRow.length > 0 || currentField.length > 0) {
              currentRow.push(currentField);
              rows.push(currentRow);
           }
           currentRow = [];
           currentField = '';
        } else {
           currentField += char;
        }
      }
      
      // Push last row if exists
      if (currentRow.length > 0 || currentField.length > 0) {
         currentRow.push(currentField);
         rows.push(currentRow);
      }

      const trades: Trade[] = [];
      const journalEntries: JournalEntry[] = [];
      let totalCapital = 1000000;

      rows.forEach(row => {
        if (row.length === 0) return;
        
        // Basic filter for empty or non-data rows
        const firstCell = row[0].trim();
        if (!firstCell) return;

        const recordType = firstCell;

        if (recordType === 'TRADE') {
            // Expected: RecordType,ID,Type,StockCode,Date,Price,Shares,IsETF,Phase,Note,Timestamp
            if (row.length >= 11) {
                trades.push({
                    id: row[1],
                    type: (row[2] as 'BUY' | 'SELL') || 'BUY',
                    stockCode: row[3],
                    date: row[4],
                    price: Number(row[5]),
                    shares: Number(row[6]),
                    isETF: row[7] === 'TRUE',
                    phase: row[8] as any,
                    note: row[9],
                    timestamp: Number(row[10])
                });
            }
        } else if (recordType === 'JOURNAL') {
           // Expected: RecordType,ID,Date,StockCode,Content,Timestamp
           if (row.length >= 6) {
               journalEntries.push({
                   id: row[1],
                   date: row[2],
                   stockCode: row[3],
                   content: row[4],
                   timestamp: Number(row[5])
               });
           }
        } else if (recordType === 'CAPITAL') {
           totalCapital = Number(row[2]);
        }
      });
      
      resolve({ trades, journalEntries, totalCapital });
    };
    reader.readAsText(file);
  });
};