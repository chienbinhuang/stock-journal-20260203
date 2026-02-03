import React, { useState } from 'react';
import { Trade, TradePhase, TradeType } from '../types';
import { PHASE_OPTIONS } from '../constants';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface Props {
  onAddTrade: (trade: Trade) => void;
}

const TradeInput: React.FC<Props> = ({ onAddTrade }) => {
  const [type, setType] = useState<TradeType>('BUY');
  const [stockCode, setStockCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('');
  const [isETF, setIsETF] = useState(false);
  const [phase, setPhase] = useState<TradePhase>('TREND');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockCode || !price || !shares) return;

    const newTrade: Trade = {
      id: Date.now().toString(),
      stockCode: stockCode.toUpperCase(),
      date,
      type,
      price: parseFloat(price),
      shares: parseInt(shares),
      isETF,
      phase,
      note,
      timestamp: new Date(date).getTime()
    };

    onAddTrade(newTrade);
    // Reset critical fields
    setPrice('');
    setShares('');
    setNote('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        {type === 'BUY' ? <PlusCircle className="text-red-500" /> : <MinusCircle className="text-green-500" />}
        新增交易記錄
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Type Selector */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('BUY')}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'BUY' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}
          >
            買入 (BUY)
          </button>
          <button
            type="button"
            onClick={() => setType('SELL')}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === 'SELL' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500'}`}
          >
            賣出 (SELL)
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">股票代號</label>
            <input
              type="text"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g. 2330"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交易日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>
        </div>

        {/* Price & Qty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成交價格</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成交股數</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
              placeholder="1000"
              required
            />
          </div>
        </div>

        {/* Checkbox for ETF */}
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
          <input
            type="checkbox"
            id="isETF"
            checked={isETF}
            onChange={(e) => setIsETF(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="isETF" className="text-gray-700 font-medium">此商品為 ETF (稅率 0.1%)</label>
        </div>

        {/* Strategy & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">交易週期/狀態</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as TradePhase)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {PHASE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">覆盤筆記</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="進出場理由..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          提交交易
        </button>
      </form>
    </div>
  );
};

export default TradeInput;