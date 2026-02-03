import React, { useState } from 'react';
import { StockSummary, Trade, TradePhase, TradeType } from '../types';
import { Edit2, History, Trash2, X, Save } from 'lucide-react';
import { PHASE_OPTIONS } from '../constants';

interface Props {
  summaries: StockSummary[];
  allTrades: Trade[];
  onUpdatePrice: (code: string, price: number) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

const StockList: React.FC<Props> = ({ summaries, allTrades, onUpdatePrice, onEditTrade, onDeleteTrade }) => {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Filter trades for the selected stock
  const stockTrades = selectedStock 
    ? allTrades.filter(t => t.stockCode === selectedStock).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">代號</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">庫存 / 成本 / 均價</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">現價 (更新)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">資金佔比</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">浮動盈虧</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">已實現損益</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">持有天數</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">年化報酬</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((stock) => {
                const avgCost = stock.sharesHeld > 0 ? stock.totalInvestedCost / stock.sharesHeld : 0;
                
                return (
                <tr key={stock.stockCode} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-lg">{stock.stockCode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-gray-900 font-medium">{stock.sharesHeld.toLocaleString()} 股</div>
                    <div className="text-xs text-gray-400 mb-1">總額: ${Math.round(stock.totalInvestedCost).toLocaleString()}</div>
                    {stock.sharesHeld > 0 && (
                        <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-100">
                            均價: ${avgCost.toFixed(2)}
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                     <div className="flex items-center justify-end gap-2">
                         <span className="font-mono font-medium text-gray-900 text-lg">${stock.currentPrice}</span>
                         <button 
                           onClick={() => {
                               const newPrice = prompt(`更新 ${stock.stockCode} 現價`, stock.currentPrice.toString());
                               if (newPrice && !isNaN(parseFloat(newPrice))) {
                                   onUpdatePrice(stock.stockCode, parseFloat(newPrice));
                               }
                           }}
                           className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                         >
                             <Edit2 size={14} />
                         </button>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-gray-900 font-medium text-lg">
                      {stock.allocationPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${stock.unrealizedPL >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {stock.sharesHeld > 0 ? (stock.unrealizedPL > 0 ? '+' : '') + Math.round(stock.unrealizedPL).toLocaleString() : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${stock.realizedPL >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {stock.realizedPL > 0 ? '+' : ''}{Math.round(stock.realizedPL).toLocaleString()}
                    <div className="text-xs font-normal text-gray-400">
                      ROI: {(stock.realizedROI * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      {Math.round(stock.avgHoldingDays)} 天
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${stock.annualizedROI >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {(stock.annualizedROI * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                        onClick={() => setSelectedStock(stock.stockCode)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <History size={16} /> 明細
                    </button>
                  </td>
                </tr>
              )})}
              {summaries.length === 0 && (
                  <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                          尚無交易記錄
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade History Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStock(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedStock} 交易明細</h2>
                    <p className="text-sm text-gray-500">檢視、修改或刪除此股票的歷史紀錄</p>
                </div>
                <button 
                    onClick={() => setSelectedStock(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div className="overflow-y-auto p-4">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">日期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">類別</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">價格</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">股數</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">策略/週期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">筆記</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">管理</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {stockTrades.map(trade => (
                            <EditableTradeRow 
                                key={trade.id} 
                                trade={trade} 
                                onSave={onEditTrade} 
                                onDelete={onDeleteTrade} 
                            />
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Internal component for handling row editing state
const EditableTradeRow: React.FC<{
    trade: Trade;
    onSave: (trade: Trade) => void;
    onDelete: (id: string) => void;
}> = ({ trade, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Trade>(trade);

    const handleSave = () => {
        onSave(editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <tr className="bg-blue-50">
                <td className="px-2 py-3">
                    <input 
                        type="date" 
                        value={editData.date}
                        onChange={e => setEditData({...editData, date: e.target.value, timestamp: new Date(e.target.value).getTime()})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-gray-900"
                    />
                </td>
                <td className="px-2 py-3">
                    <select 
                        value={editData.type}
                        onChange={e => setEditData({...editData, type: e.target.value as TradeType})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-gray-900"
                    >
                        <option value="BUY">買入</option>
                        <option value="SELL">賣出</option>
                    </select>
                </td>
                <td className="px-2 py-3">
                    <input 
                        type="number" 
                        step="0.01"
                        value={editData.price}
                        onChange={e => setEditData({...editData, price: Number(e.target.value)})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-right text-gray-900"
                    />
                </td>
                <td className="px-2 py-3">
                    <input 
                        type="number" 
                        value={editData.shares}
                        onChange={e => setEditData({...editData, shares: Number(e.target.value)})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-right text-gray-900"
                    />
                </td>
                <td className="px-2 py-3">
                    <select
                        value={editData.phase}
                        onChange={e => setEditData({...editData, phase: e.target.value as TradePhase})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-gray-900"
                    >
                        {PHASE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </td>
                <td className="px-2 py-3">
                    <input 
                        type="text" 
                        value={editData.note}
                        onChange={e => setEditData({...editData, note: e.target.value})}
                        className="w-full p-1 rounded border border-blue-200 text-sm text-gray-900"
                    />
                </td>
                <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                            <Save size={16} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                            <X size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-gray-50 group">
            <td className="px-4 py-3 text-sm text-gray-900 font-mono">{trade.date}</td>
            <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {trade.type === 'BUY' ? '買入' : '賣出'}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-right text-gray-900 font-mono">${trade.price}</td>
            <td className="px-4 py-3 text-sm text-right text-gray-900 font-mono">{trade.shares}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {PHASE_OPTIONS.find(p => p.value === trade.phase)?.label}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px]">{trade.note}</td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(trade.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default StockList;