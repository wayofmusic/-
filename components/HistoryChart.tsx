import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WorkoutSession } from '../types';

interface HistoryChartProps {
  sessions: WorkoutSession[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ sessions }) => {
  // Aggregate data by day (last 7 entries for simplicity)
  const data = sessions.slice(0, 7).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    durationMinutes: Math.floor(s.totalTime / 60000 * 10) / 10, // Round to 1 decimal
    type: s.type
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-64 w-full mt-6 bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 ml-2">近期运动趋势 (分钟)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
            itemStyle={{ color: '#4ade80' }}
            formatter={(value: number) => [`${value} 分钟`, '时长']}
          />
          <Bar dataKey="durationMinutes" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.durationMinutes > 30 ? '#22c55e' : '#4ade80'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};