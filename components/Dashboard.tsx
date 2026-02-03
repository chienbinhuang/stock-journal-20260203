import React from 'react';
import { PortfolioStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Percent, ShieldAlert } from 'lucide-react';

interface Props {
  stats: PortfolioStats;
}

const StatCard = ({ title, value, subValue, icon: Icon, color, isCurrency = false, isPercent = false }: any) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-500 text-sm font-medium">{title}</span>
      <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <div>
      <div className={`text-2xl font-bold ${value < 0 ? 'text-green-600' : (title.includes('盈虧') && value > 0 ? 'text-red-600' : 'text-gray-900')}`}>
        {isCurrency ? `$${value.toLocaleString()}` : isPercent ? `${value.toFixed(2)}%` : value}
      </div>
      {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
    </div>
  </div>
);

const Dashboard: React.FC<Props> = ({ stats }) => {
  const data = [
    { name: '現金', value: Math.max(0, stats.cashBalance), color: '#34C759' }, // iOS Green
    { name: '股票市值', value: Math.max(0, stats.totalMarketValue - stats.cashBalance), color: '#007AFF' }, // iOS Blue
  ];

  return (
    <div className="space-y-6">
      {/* Capital Overview */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">資金分佈</h2>
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 md:pl-8 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">總投入本金</span>
              <span className="font-mono font-bold">${stats.totalCapital.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">當前總資產</span>
              <span className={`font-mono font-bold ${stats.totalMarketValue > stats.totalCapital ? 'text-red-600' : 'text-green-600'}`}>
                ${stats.totalMarketValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">總報酬率 (歷史)</span>
              <span className={`font-bold px-2 py-1 rounded-lg ${stats.totalROI_AllTime >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {stats.totalROI_AllTime > 0 ? '+' : ''}{stats.totalROI_AllTime.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="浮動盈虧" 
          value={stats.floatingPL} 
          icon={Activity} 
          color="bg-blue-500" 
          isCurrency 
        />
        <StatCard 
          title="已實現損益" 
          value={stats.realizedCumulativePL} 
          icon={DollarSign} 
          color="bg-purple-500" 
          isCurrency 
        />
        <StatCard 
          title="年度總報酬" 
          value={stats.totalROI_YTD} 
          icon={TrendingUp} 
          color="bg-orange-500" 
          isPercent 
        />
        <StatCard 
          title="最大回撤" 
          value={stats.maxDrawdown} 
          icon={TrendingDown} 
          color="bg-green-600" 
          isPercent 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="交易勝率" 
          value={stats.winRate} 
          subValue={`總交易數: ${stats.tradeCount}`}
          icon={Percent} 
          color="bg-indigo-500" 
          isPercent 
        />
        <StatCard 
          title="盈虧比" 
          value={stats.avgWinLossRatio.toFixed(2)} 
          subValue="平均獲利 / 平均虧損"
          icon={ShieldAlert} 
          color="bg-pink-500" 
        />
      </div>
    </div>
  );
};

export default Dashboard;