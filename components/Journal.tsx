import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { BookOpen, Calendar, Save, Edit2, Trash2, X } from 'lucide-react';

interface Props {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const Journal: React.FC<Props> = ({ entries, onAddEntry, onEditEntry, onDeleteEntry }) => {
  const [stockCode, setStockCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    if (editingId) {
        onEditEntry({
            id: editingId,
            stockCode: stockCode.toUpperCase(),
            date,
            content,
            timestamp: new Date(date).getTime()
        });
        setEditingId(null);
    } else {
        onAddEntry({
            id: Date.now().toString(),
            stockCode: stockCode.toUpperCase(),
            date,
            content,
            timestamp: new Date(date).getTime()
        });
    }
    
    // Reset form
    setContent('');
    setStockCode('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditClick = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setStockCode(entry.stockCode || '');
    setDate(entry.date);
    setContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setStockCode('');
    setContent('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {/* Input Side */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 md:col-span-1 h-fit sticky top-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-500"/> 
            {editingId ? '編輯覆盤' : '撰寫覆盤'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-500">日期</label>
                <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-50 rounded-xl text-gray-900"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">相關代號 (選填)</label>
                <input 
                    type="text" 
                    value={stockCode}
                    onChange={e => setStockCode(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-50 rounded-xl text-gray-900"
                    placeholder="2330"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-gray-500">筆記內容</label>
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl h-40 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                    placeholder="今日心得、策略調整、情緒記錄..."
                />
            </div>
            
            <div className="flex gap-2">
                <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    <Save size={18} /> {editingId ? '更新筆記' : '儲存筆記'}
                </button>
                {editingId && (
                    <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </form>
      </div>

      {/* List Side */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 md:col-span-2 overflow-y-auto max-h-[80vh] no-scrollbar">
        <h2 className="text-lg font-bold text-gray-800 mb-4">歷史記錄</h2>
        <div className="space-y-4">
            {sortedEntries.map(entry => (
                <div key={entry.id} className={`p-4 rounded-2xl border transition-all ${editingId === entry.id ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400"/>
                            <span className="text-sm font-mono font-medium text-gray-600">{entry.date}</span>
                            {entry.stockCode && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                    {entry.stockCode}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => handleEditClick(entry)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="編輯"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => onDeleteEntry(entry.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="刪除"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                    </p>
                </div>
            ))}
            {sortedEntries.length === 0 && (
                <div className="text-center text-gray-400 py-10">尚無筆記</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Journal;