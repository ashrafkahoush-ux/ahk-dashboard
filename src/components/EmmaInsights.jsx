import React, { useState, useEffect } from 'react';
import emmaMemory from '../ai/emmaMemory';
import { Brain, TrendingUp, Clock, Command, BarChart3, Target } from 'lucide-react';

export default function EmmaInsights() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load stats
    const loadStats = () => {
      const memoryStats = emmaMemory.getStats();
      setStats(memoryStats);
    };

    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return null;
  }

  const formatHour = (hour) => {
    if (hour === null) return 'Learning...';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const insightCards = [
    {
      icon: Command,
      label: 'Total Commands',
      value: stats.totalCommands,
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
    },
    {
      icon: BarChart3,
      label: 'Reports Generated',
      value: stats.totalReports,
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    {
      icon: Clock,
      label: 'Peak Hour',
      value: formatHour(stats.peakHour),
      color: 'from-orange-500 to-amber-500',
      glow: 'shadow-orange-500/50',
    },
    {
      icon: TrendingUp,
      label: 'Reports/Week',
      value: stats.reportsPerWeek,
      color: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
    {
      icon: Target,
      label: 'Favorite Command',
      value: stats.mostUsedCommand || 'None yet',
      color: 'from-indigo-500 to-purple-500',
      glow: 'shadow-indigo-500/50',
      small: true,
    },
    {
      icon: Brain,
      label: 'Suggestion Success',
      value: `${stats.suggestionAcceptance}%`,
      color: 'from-rose-500 to-pink-500',
      glow: 'shadow-rose-500/50',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Emma's Insights</h2>
          <p className="text-slate-400 text-sm">
            Learning your patterns for {stats.daysSinceFirstUse} {stats.daysSinceFirstUse === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`
                relative overflow-hidden rounded-xl p-5
                bg-gradient-to-br ${card.color}
                shadow-xl ${card.glow}
                transform transition-all duration-300
                hover:scale-105 hover:shadow-2xl
                border border-white/10
              `}
            >
              {/* Background glow effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-6 h-6 text-white/80" />
                  <div className="px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-medium text-white">Live</span>
                  </div>
                </div>
                
                <div className="text-white">
                  <div className={`font-bold mb-1 ${card.small ? 'text-lg' : 'text-3xl'}`}>
                    {card.value}
                  </div>
                  <div className="text-white/80 text-sm font-medium">
                    {card.label}
                  </div>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          );
        })}
      </div>

      {/* Learning Progress Bar */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Emma's Learning Progress</span>
          <span className="text-xs text-slate-400">
            {Math.min(100, Math.floor((stats.totalCommands / 50) * 100))}% Complete
          </span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-1000 animate-pulse"
            style={{
              width: `${Math.min(100, (stats.totalCommands / 50) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {stats.totalCommands < 50 
            ? `${50 - stats.totalCommands} more commands until Emma knows you perfectly!`
            : 'Emma has mastered your patterns! 🎉'}
        </p>
      </div>
    </div>
  );
}
