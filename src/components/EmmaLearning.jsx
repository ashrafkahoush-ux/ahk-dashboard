import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Activity,
  Zap,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getLearningInsights,
  forceLearningCycle,
  exportLearningData,
  resetLearning
} from '../ai/EmmaCore.mjs';
import { startSelfLearning, stopSelfLearning, isSelfLearningActive } from '../ai/selfLearner.mjs';

export default function EmmaLearning() {
  const [insights, setInsights] = useState(null);
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Load initial insights
    refreshInsights();
    
    // Check if self-learning is active
    setIsLearningActive(isSelfLearningActive());
    
    // Listen for learning updates
    const handleLearningUpdate = (event) => {
      setInsights(event.detail);
      setLastUpdate(new Date());
    };
    
    window.addEventListener('emma-learning-update', handleLearningUpdate);
    
    return () => {
      window.removeEventListener('emma-learning-update', handleLearningUpdate);
    };
  }, []);

  const refreshInsights = () => {
    const data = getLearningInsights();
    setInsights(data);
    setLastUpdate(new Date());
  };

  const toggleSelfLearning = () => {
    if (isLearningActive) {
      stopSelfLearning();
      setIsLearningActive(false);
    } else {
      startSelfLearning(30); // 30 minutes
      setIsLearningActive(true);
    }
  };

  const handleForceUpdate = () => {
    forceLearningCycle();
    setTimeout(refreshInsights, 500);
  };

  const handleExport = () => {
    const data = exportLearningData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emma-learning-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('🧠 Reset all of Emma\'s learning data? This cannot be undone.')) {
      resetLearning();
      refreshInsights();
    }
  };

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
        <div className="text-center text-white">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p>Loading Emma's cognitive core...</p>
        </div>
      </div>
    );
  }

  const { summary, styleModel, recommendations } = insights;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-white">Emma's Learning Intelligence</h1>
        </div>
        <p className="text-slate-400">Self-optimizing AI with adaptive communication & pattern recognition</p>
        <p className="text-sm text-slate-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={toggleSelfLearning}
          className={`p-4 rounded-xl border-2 transition-all ${
            isLearningActive
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-green-500'
          }`}
        >
          <Zap className="w-6 h-6 mx-auto mb-2" />
          <span className="font-semibold">
            {isLearningActive ? 'Active' : 'Paused'}
          </span>
        </button>

        <button
          onClick={handleForceUpdate}
          className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:border-cyan-500 transition-all"
        >
          <RefreshCw className="w-6 h-6 mx-auto mb-2" />
          <span className="font-semibold">Analyze Now</span>
        </button>

        <button
          onClick={handleExport}
          className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:border-blue-500 transition-all"
        >
          <Download className="w-6 h-6 mx-auto mb-2" />
          <span className="font-semibold">Export Data</span>
        </button>

        <button
          onClick={handleReset}
          className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:border-red-500 transition-all"
        >
          <Trash2 className="w-6 h-6 mx-auto mb-2" />
          <span className="font-semibold">Reset</span>
        </button>
      </div>

      {/* Style Model Card */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 mb-8 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Current Communication Style</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-6xl font-bold text-purple-400 mb-2">
              {styleModel.current}
            </p>
            <p className="text-slate-400">Adaptive style profile</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Acceptance Rate:</span>
              <span className="text-white font-semibold">{styleModel.acceptanceRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verbosity:</span>
              <span className="text-white font-semibold">{styleModel.adjustments.verbosity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Empathy:</span>
              <span className="text-white font-semibold">{styleModel.adjustments.empathy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Proactivity:</span>
              <span className="text-white font-semibold">{styleModel.adjustments.proactivity}</span>
            </div>
          </div>
        </div>

        {/* Acceptance Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Response Quality</span>
            <span className="text-white">{styleModel.acceptanceRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.min(styleModel.acceptanceRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Learning Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <Activity className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-3xl font-bold text-white mb-1">{summary.total}</p>
          <p className="text-slate-400 text-sm">Total Interactions</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <Clock className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-3xl font-bold text-white mb-1">{summary.peakHour}:00</p>
          <p className="text-slate-400 text-sm">Peak Activity Hour</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <p className="text-3xl font-bold text-white mb-1">{summary.accepted}</p>
          <p className="text-slate-400 text-sm">Accepted Responses</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-3xl font-bold text-white mb-1">{summary.rejected}</p>
          <p className="text-slate-400 text-sm">Rejected Responses</p>
        </div>
      </div>

      {/* Most Used Command */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Top Command</h3>
        </div>
        <p className="text-4xl font-bold text-blue-400 mb-2">{summary.topCommand}</p>
        <p className="text-slate-400">{summary.insight}</p>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-green-400" />
            <h3 className="text-xl font-bold text-white">AI Recommendations</h3>
          </div>
          
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {rec.type}
                    </span>
                    <p className="text-white mt-1">{rec.message}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
