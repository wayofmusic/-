import React from 'react';
import { formatTime } from '../utils';

interface TimerDisplayProps {
  time: number;
  isOvertime?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ time, isOvertime = false }) => {
  const formatted = formatTime(time);
  const [main, centi] = formatted.split('.');

  return (
    <div className="flex flex-col items-center justify-center py-12 relative">
      {isOvertime && (
        <div className="absolute top-0 md:top-4 text-red-500 font-bold tracking-widest uppercase text-sm animate-pulse">
          已超时
        </div>
      )}
      <div className="relative z-10 font-mono text-center select-none">
        <div className={`text-7xl md:text-9xl font-bold tracking-tight tabular-nums drop-shadow-2xl transition-colors duration-300 ${isOvertime ? 'text-red-500' : 'text-white'}`}>
          {main}
          <span className={`text-4xl md:text-5xl font-normal ml-1 ${isOvertime ? 'text-red-400' : 'text-brand-500'}`}>.{centi}</span>
        </div>
      </div>
      {/* Glow effect */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl -z-0 pointer-events-none transition-colors duration-500 ${isOvertime ? 'bg-red-500/20' : 'bg-brand-500/10'}`}></div>
    </div>
  );
};