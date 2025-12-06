import React from 'react';
import { Lap } from '../types';
import { formatTime } from '../utils';

interface LapListProps {
  laps: Lap[];
}

export const LapList: React.FC<LapListProps> = ({ laps }) => {
  // Show fastest and slowest in different colors if we have enough laps
  let minTime = Infinity;
  let maxTime = -1;

  if (laps.length >= 2) {
    laps.forEach(l => {
        if (l.time < minTime) minTime = l.time;
        if (l.time > maxTime) maxTime = l.time;
    });
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6 overflow-hidden bg-slate-800/50 rounded-2xl backdrop-blur-sm border border-slate-700/50">
      <div className="max-h-60 overflow-y-auto p-4 space-y-2">
        {laps.length === 0 && (
          <div className="text-center text-slate-500 py-4 text-sm">暂无计次记录</div>
        )}
        {[...laps].reverse().map((lap) => {
          const isFastest = laps.length >= 2 && lap.time === minTime;
          const isSlowest = laps.length >= 2 && lap.time === maxTime;
          
          return (
            <div 
              key={lap.id} 
              className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm md:text-base border border-transparent transition-colors
                ${isFastest ? 'bg-green-500/10 border-green-500/20 text-green-400' : ''}
                ${isSlowest ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'text-slate-200'}
                ${!isFastest && !isSlowest ? 'hover:bg-slate-700/50' : ''}
              `}
            >
              <span className="font-mono opacity-60 w-12">#{lap.lapNumber}</span>
              <span className="font-mono tracking-wider">{formatTime(lap.time)}</span>
              <span className="font-mono text-xs opacity-50 w-16 text-right">+{formatTime(lap.splitTime)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};