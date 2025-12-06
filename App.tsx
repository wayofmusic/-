import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Button } from './components/Button';
import { LapList } from './components/LapList';
import { AIAnalysis } from './components/AIAnalysis';
import { HistoryChart } from './components/HistoryChart';
import { Lap, WorkoutType, WorkoutSession } from './types';
import { generateId, formatDuration, formatTime } from './utils';
import { Trash2, History, Timer as TimerIcon, Save, Play, Pause, Square, Flag, Hourglass, Plus, Minus } from 'lucide-react';

// Sound helper function
const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export default function App() {
  // View State
  const [view, setView] = useState<'timer' | 'history'>('timer');
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');

  // Timer State
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  
  // Countdown State
  const [countdownInput, setCountdownInput] = useState({ minutes: 0, seconds: 0 });
  const [initialCountdownTime, setInitialCountdownTime] = useState(0);

  // Data State
  const [laps, setLaps] = useState<Lap[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  
  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveDuration, setSaveDuration] = useState(0);
  const [selectedType, setSelectedType] = useState<WorkoutType>(WorkoutType.RUNNING);

  // Refs
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const hasPlayedSoundRef = useRef(false);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('smartmotion_history');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Timer Logic
  const animate = useCallback(() => {
    if (isRunning) {
      const now = Date.now();
      const elapsed = accumulatedTimeRef.current + (now - startTimeRef.current);

      if (timerMode === 'stopwatch') {
        setTime(elapsed);
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Countdown Logic
        const remaining = initialCountdownTime - elapsed;
        
        if (remaining <= 0) {
          // Overtime Logic
          if (!hasPlayedSoundRef.current) {
             playNotificationSound();
             hasPlayedSoundRef.current = true;
          }
          setIsOvertime(true);
          setTime(Math.abs(remaining));
        } else {
          setIsOvertime(false);
          setTime(remaining);
        }
        requestRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isRunning, timerMode, initialCountdownTime]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, animate]);

  // Handlers
  const handleStart = () => {
    if (timerMode === 'countdown' && initialCountdownTime === 0) {
        // Start from input (New Session)
        const duration = (countdownInput.minutes * 60 + countdownInput.seconds) * 1000;
        if (duration <= 0) return; // Don't start if 0
        setInitialCountdownTime(duration);
        setTime(duration);
        accumulatedTimeRef.current = 0;
        setIsOvertime(false);
        hasPlayedSoundRef.current = false;
        setIsRunning(true);
    } else {
        // Resume
        setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    // Calculate elapsed time accurately
    const now = Date.now();
    const elapsed = accumulatedTimeRef.current + (now - startTimeRef.current);
    accumulatedTimeRef.current = elapsed;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    accumulatedTimeRef.current = 0;
    setLaps([]);
    setInitialCountdownTime(0); // This triggers "Setup Mode" for countdown
    setIsOvertime(false);
    hasPlayedSoundRef.current = false;
  };

  const handleLap = () => {
    const lapTime = laps.length === 0 ? time : time - laps[0].splitTime;
    const newLap: Lap = {
      id: generateId(),
      time: lapTime,
      splitTime: time,
      lapNumber: laps.length + 1,
    };
    setLaps([newLap, ...laps]);
  };

  const handleSave = () => {
    let finalElapsed = accumulatedTimeRef.current;
    
    // If running, we need to capture the pending time in accumulatedTimeRef
    if (isRunning) {
        const now = Date.now();
        finalElapsed = accumulatedTimeRef.current + (now - startTimeRef.current);
        accumulatedTimeRef.current = finalElapsed;
        setIsRunning(false);
    }

    setSaveDuration(finalElapsed);
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    const finalDuration = saveDuration;
    let finalLaps = laps;

    // For countdown, if no laps, create one summary lap
    if (timerMode === 'countdown' && finalLaps.length === 0 && finalDuration > 0) {
        finalLaps = [{
            id: generateId(),
            time: finalDuration,
            splitTime: finalDuration,
            lapNumber: 1
        }];
    }

    const newSession: WorkoutSession = {
      id: generateId(),
      date: new Date().toISOString(),
      type: selectedType,
      totalTime: finalDuration,
      laps: finalLaps,
    };
    
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('smartmotion_history', JSON.stringify(updatedSessions));
    
    setShowSaveModal(false);
    handleReset();
    setView('history');
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('smartmotion_history', JSON.stringify(updated));
  };

  const toggleTimerMode = (mode: 'stopwatch' | 'countdown') => {
    if (isRunning) return; // Prevent switching while running
    setTimerMode(mode);
    handleReset();
  };

  const adjustCountdownInput = (type: 'minutes' | 'seconds', amount: number) => {
    setCountdownInput(prev => {
        let val = prev[type] + amount;
        if (val < 0) val = 0;
        if (type === 'seconds' && val >= 60) val = 59;
        if (type === 'minutes' && val > 999) val = 999;
        return { ...prev, [type]: val };
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-500 selection:text-white pb-24 md:pb-12">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 app-drag-region">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <TimerIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden md:block">智动秒表</h1>
            <h1 className="font-bold text-xl tracking-tight md:hidden">SmartMotion</h1>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-full border border-slate-700 app-no-drag">
          <button 
            onClick={() => setView('timer')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'timer' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            计时
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            记录
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-2xl pt-6">
        {view === 'timer' ? (
          <div className="flex flex-col animate-fade-in">
             
             {/* Mode Switcher */}
             <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg bg-slate-800/50 p-1 border border-slate-700/50">
                    <button
                        onClick={() => toggleTimerMode('stopwatch')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${timerMode === 'stopwatch' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <TimerIcon className="w-4 h-4" />
                        秒表
                    </button>
                    <button
                        onClick={() => toggleTimerMode('countdown')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${timerMode === 'countdown' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Hourglass className="w-4 h-4" />
                        倒计时
                    </button>
                </div>
             </div>

            {/* Timer Display Area */}
            {timerMode === 'countdown' && initialCountdownTime === 0 ? (
                // Countdown Setup View
                <div className="flex flex-col items-center justify-center py-12 min-h-[300px]">
                    <div className="flex items-end gap-4 mb-8">
                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase tracking-wider mb-2">分钟</span>
                            <div className="relative group">
                                <input 
                                    type="number" 
                                    min="0"
                                    max="999"
                                    value={countdownInput.minutes}
                                    onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        setCountdownInput({...countdownInput, minutes: val});
                                    }}
                                    className="w-32 bg-transparent text-7xl font-mono text-center font-bold text-white border-b-2 border-slate-700 focus:border-brand-500 outline-none transition-colors p-2"
                                />
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => adjustCountdownInput('minutes', 1)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Plus size={16}/></button>
                                    <button onClick={() => adjustCountdownInput('minutes', -1)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={16}/></button>
                                </div>
                            </div>
                        </div>
                        
                        <span className="text-6xl text-slate-600 font-light pb-4">:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase tracking-wider mb-2">秒</span>
                            <div className="relative group">
                                <input 
                                    type="number" 
                                    min="0"
                                    max="59"
                                    value={countdownInput.seconds}
                                    onChange={(e) => {
                                        let val = Math.max(0, parseInt(e.target.value) || 0);
                                        if (val > 59) val = 59;
                                        setCountdownInput({...countdownInput, seconds: val});
                                    }}
                                    className="w-32 bg-transparent text-7xl font-mono text-center font-bold text-white border-b-2 border-slate-700 focus:border-brand-500 outline-none transition-colors p-2"
                                />
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => adjustCountdownInput('seconds', 1)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Plus size={16}/></button>
                                    <button onClick={() => adjustCountdownInput('seconds', -1)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="flex gap-3 flex-wrap justify-center">
                        {[1, 3, 5, 10, 15, 30].map(m => (
                            <button 
                                key={m}
                                onClick={() => setCountdownInput({minutes: m, seconds: 0})}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
                            >
                                {m}分钟
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                // Timer Display (Shared)
                <TimerDisplay time={time} isOvertime={isOvertime} />
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 md:gap-8 my-8">
                {/* Left Button: Lap/Reset (Stopwatch) or Reset (Countdown) */}
                <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={timerMode === 'stopwatch' && isRunning ? handleLap : handleReset}
                    className="w-16 h-16 rounded-full"
                    disabled={!isRunning && time === 0 && initialCountdownTime === 0}
                >
                    {timerMode === 'stopwatch' && isRunning ? <Flag className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                </Button>

                {/* Center Button: Start/Pause */}
                <Button 
                    variant={isRunning ? 'danger' : 'primary'} 
                    size="icon"
                    onClick={isRunning ? handlePause : handleStart}
                    className="w-24 h-24 rounded-full text-2xl shadow-xl transition-transform active:scale-95"
                    disabled={timerMode === 'countdown' && countdownInput.minutes === 0 && countdownInput.seconds === 0 && initialCountdownTime === 0}
                >
                    {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                </Button>

                {/* Right Button: Save */}
                <Button 
                    variant="secondary"
                    size="icon"
                    onClick={handleSave}
                    className="w-16 h-16 rounded-full"
                    // Disable save if timer is at 0 (start) for stopwatch, or if nothing happened in countdown
                    disabled={
                        (timerMode === 'stopwatch' && time === 0) || 
                        (timerMode === 'countdown' && initialCountdownTime === 0)
                    }
                >
                    <Save className="w-6 h-6" />
                </Button>
            </div>

            {timerMode === 'stopwatch' && <LapList laps={laps} />}
            {timerMode === 'countdown' && initialCountdownTime > 0 && (
                <div className="text-center text-slate-500 text-sm mt-4">
                    目标时长: {formatDuration(initialCountdownTime)}
                </div>
            )}

          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <AIAnalysis sessions={sessions} />
            <HistoryChart sessions={sessions} />

            <div className="space-y-4">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <History className="w-5 h-5 text-brand-400" />
                 历史记录
               </h3>
               {sessions.length === 0 ? (
                 <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                    <p className="text-slate-500">暂无运动记录，快去运动吧！</p>
                    <Button variant="ghost" onClick={() => setView('timer')} className="mt-4 text-brand-400">去计时</Button>
                 </div>
               ) : (
                 <div className="grid gap-3">
                   {sessions.map(session => (
                     <div key={session.id} className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center group hover:border-brand-500/30 transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-brand-900/50 text-brand-400 text-xs px-2 py-0.5 rounded border border-brand-500/20">
                                    {session.type}
                                </span>
                                <span className="text-slate-400 text-xs">
                                    {new Date(session.date).toLocaleDateString('zh-CN')} {new Date(session.date).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <div className="text-xl font-mono font-bold text-white">
                                {formatTime(session.totalTime)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {session.laps.length > 0 ? `${session.laps.length} 圈/段` : '定式训练'}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="删除"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700 scale-100 transition-transform">
                <h3 className="text-xl font-bold text-white mb-4">保存本次运动</h3>
                <div className="mb-6">
                    <div className="text-4xl font-mono text-center text-brand-400 font-bold py-4">
                        {formatTime(saveDuration)}
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">运动类型</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(WorkoutType).map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all
                                    ${selectedType === type 
                                        ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                                        : 'bg-slate-700/50 border-transparent text-slate-300 hover:bg-slate-700'
                                    }
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowSaveModal(false)}>取消</Button>
                    <Button variant="primary" className="flex-1" onClick={confirmSave}>保存记录</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}