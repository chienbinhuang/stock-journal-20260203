import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Trade, JournalEntry } from './types';
import { INITIAL_CAPITAL_DEFAULT } from './constants';
import { calculatePortfolio } from './services/finance';
import { exportDataToCSV, parseCSVImport } from './services/csvHandler';

// Components
import Dashboard from './components/Dashboard';
import TradeInput from './components/TradeInput';
import StockList from './components/StockList';
import Journal from './components/Journal';
import DataSettings from './components/DataSettings';

// Icons
import { LayoutDashboard, PenTool, List, Book, Settings } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [totalCapital, setTotalCapital] = useState<number>(INITIAL_CAPITAL_DEFAULT);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INPUT' | 'LIST' | 'JOURNAL' | 'SETTINGS'>('DASHBOARD');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('trading_journal_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTotalCapital(parsed.totalCapital || INITIAL_CAPITAL_DEFAULT);
        setTrades(parsed.trades || []);
        setJournalEntries(parsed.journalEntries || []);
        setCurrentPrices(parsed.currentPrices || {});
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  useEffect(() => {
    const data: AppState = { totalCapital, trades, journalEntries, currentPrices };
    localStorage.setItem('trading_journal_data', JSON.stringify(data));
  }, [totalCapital, trades, journalEntries, currentPrices]);

  // Derived Data
  const { stats, stockSummaries } = useMemo(() => {
    return calculatePortfolio(totalCapital, trades, currentPrices);
  }, [totalCapital, trades, currentPrices]);

  // Handlers
  const handleAddTrade = (trade: Trade) => {
    setTrades(prev => [...prev, trade]);
    // Auto update current price to latest trade price
    setCurrentPrices(prev => ({...prev, [trade.stockCode]: trade.price}));
    alert('交易已新增');
  };

  const handleEditTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('確定要刪除這筆交易紀錄嗎？刪除後無法復原。')) {
        setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdatePrice = (code: string, price: number) => {
    setCurrentPrices(prev => ({ ...prev, [code]: price }));
  };

  const handleAddJournal = (entry: JournalEntry) => {
    setJournalEntries(prev => [...prev, entry]);
  };

  const handleEditJournal = (updatedEntry: JournalEntry) => {
    setJournalEntries(prev => prev.map(j => j.id === updatedEntry.id ? updatedEntry : j));
  };

  const handleDeleteJournal = (id: string) => {
    if (window.confirm('確定要刪除這筆筆記嗎？')) {
        setJournalEntries(prev => prev.filter(j => j.id !== id));
    }
  };

  const handleExport = () => {
    // Pass stats and summaries for a complete report
    exportDataToCSV(
      { totalCapital, trades, journalEntries, currentPrices }, 
      stats, 
      stockSummaries
    );
  };

  const handleImport = async (file: File) => {
    try {
      const data = await parseCSVImport(file);
      if (data.totalCapital) setTotalCapital(data.totalCapital);
      if (data.trades) setTrades(data.trades);
      if (data.journalEntries) setJournalEntries(data.journalEntries);
      alert('資料匯入成功！');
    } catch (e) {
      alert('匯入失敗，格式錯誤');
    }
  };

  // UI Components
  const NavButton = ({ tab, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
        activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === tab ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-ios-bg pb-20 md:pb-0">
      {/* Top Bar (Mobile/iPad) */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">台股交易覆盤筆記</h1>
        <div className="text-sm font-mono text-gray-500">
           資金: ${(stats.totalCapital / 10000).toFixed(0)}萬
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {activeTab === 'DASHBOARD' && <Dashboard stats={stats} />}
        {activeTab === 'INPUT' && <TradeInput onAddTrade={handleAddTrade} />}
        {activeTab === 'LIST' && (
            <StockList 
                summaries={stockSummaries} 
                allTrades={trades}
                onUpdatePrice={handleUpdatePrice} 
                onEditTrade={handleEditTrade}
                onDeleteTrade={handleDeleteTrade}
            />
        )}
        {activeTab === 'JOURNAL' && (
            <Journal 
                entries={journalEntries} 
                onAddEntry={handleAddJournal} 
                onEditEntry={handleEditJournal}
                onDeleteEntry={handleDeleteJournal}
            />
        )}
        {activeTab === 'SETTINGS' && (
            <DataSettings 
                totalCapital={totalCapital} 
                onUpdateCapital={setTotalCapital}
                onExport={handleExport}
                onImport={handleImport}
            />
        )}
      </main>

      {/* Bottom Navigation (iPad Style Floating or Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 md:py-4 safe-area-bottom z-50">
        <div className="flex justify-around items-center max-w-3xl mx-auto">
          <NavButton tab="DASHBOARD" icon={LayoutDashboard} label="儀表板" />
          <NavButton tab="INPUT" icon={PenTool} label="記帳" />
          <NavButton tab="LIST" icon={List} label="庫存/損益" />
          <NavButton tab="JOURNAL" icon={Book} label="覆盤筆記" />
          <NavButton tab="SETTINGS" icon={Settings} label="設定/匯出" />
        </div>
      </div>
    </div>
  );
};

export default App;