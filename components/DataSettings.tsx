import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

interface Props {
  totalCapital: number;
  onUpdateCapital: (val: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const DataSettings: React.FC<Props> = ({ totalCapital, onUpdateCapital, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">資金設定</h2>
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-500 mb-1">總資金水位</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                        type="number" 
                        value={totalCapital}
                        onChange={(e) => onUpdateCapital(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 rounded-xl font-mono text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    調整總資金會即時影響「投入資金佔比」的計算。
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">資料管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={onExport}
                className="flex items-center justify-center gap-3 p-6 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-colors border border-blue-200"
            >
                <Download size={24} />
                <div className="text-left">
                    <div className="font-bold">匯出 CSV</div>
                    <div className="text-xs opacity-70">支援 Apple Numbers / Excel</div>
                </div>
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-6 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl transition-colors border border-green-200"
            >
                <Upload size={24} />
                <div className="text-left">
                    <div className="font-bold">匯入資料</div>
                    <div className="text-xs opacity-70">回復過往備份</div>
                </div>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
            />
        </div>
      </div>
    </div>
  );
};

export default DataSettings;