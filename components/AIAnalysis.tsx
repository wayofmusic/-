import React, { useState } from 'react';
import { WorkoutSession, AIAnalysisResult } from '../types';
import { analyzeWorkouts } from '../services/geminiService';
import { Button } from './Button';

interface AIAnalysisProps {
  sessions: WorkoutSession[];
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ sessions }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeWorkouts(sessions);
      setResult(analysis);
    } catch (err: any) {
        setError(err.message || "分析失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-bold text-indigo-100">AI 智能教练</h2>
        </div>
        <Button 
            onClick={handleAnalysis} 
            disabled={loading || sessions.length === 0}
            variant="ghost"
            className="text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20"
        >
            {loading ? '分析中...' : '生成分析'}
        </Button>
      </div>

      {!result && !loading && !error && (
        <p className="text-indigo-200/60 text-sm">
            点击上方按钮，让 Gemini 为您的近期运动表现提供专业建议和总结。
        </p>
      )}

      {error && (
          <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm border border-red-500/20">
              {error}
          </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-brand-500">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-1">表现总结</h4>
            <p className="text-slate-100 leading-relaxed">{result.summary}</p>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-blue-500">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-1">改进建议</h4>
            <p className="text-slate-100 leading-relaxed">{result.advice}</p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-purple-500">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-1">每日寄语</h4>
            <p className="text-purple-200 italic font-serif text-lg">"{result.encouragement}"</p>
          </div>
        </div>
      )}
    </div>
  );
};