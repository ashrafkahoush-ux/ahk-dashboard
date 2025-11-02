// src/components/ReportsArchive.jsx
import React, { useState, useEffect } from 'react';
import ReportsManager from '../utils/reportsStorage';

export default function ReportsArchive() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pinned: 0, thisWeek: 0, totalViews: 0 });
  const [filterView, setFilterView] = useState('all'); // all, pinned, thisWeek
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = ReportsManager.getAllReports();
    setReports(allReports);
    setStats(ReportsManager.getStats());
  };

  const handleDelete = (reportId) => {
    if (confirm('Are you sure you want to delete this report?')) {
      ReportsManager.deleteReport(reportId);
      loadReports();
    }
  };

  const handleTogglePin = (reportId) => {
    ReportsManager.togglePin(reportId);
    loadReports();
  };

  const handleView = (report) => {
    ReportsManager.incrementViews(report.id);
    loadReports();
    // Open report details or download
    console.log('📄 Viewing report:', report);
  };

  const filteredReports = reports
    .filter(report => {
      if (filterView === 'pinned') return report.isPinned;
      if (filterView === 'thisWeek') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(report.createdAt) > weekAgo;
      }
      return true;
    })
    .filter(report => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return report.title?.toLowerCase().includes(query) || 
             report.type?.toLowerCase().includes(query);
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            📊 Reports Archive
            <span className="text-sm font-normal px-3 py-1 bg-purple-600/30 rounded-full">
              Emma's Collection
            </span>
          </h1>
          <p className="text-gray-300">Your strategic reports, organized and auto-managed</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90">Total Reports</div>
            <div className="text-3xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90">Pinned</div>
            <div className="text-3xl font-bold mt-1">{stats.pinned}</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90">This Week</div>
            <div className="text-3xl font-bold mt-1">{stats.thisWeek}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90">Total Views</div>
            <div className="text-3xl font-bold mt-1">{stats.totalViews}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterView('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterView === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilterView('pinned')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterView === 'pinned' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              📌 Pinned
            </button>
            <button
              onClick={() => setFilterView('thisWeek')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterView === 'thisWeek' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              📅 This Week
            </button>
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-12 text-center text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-xl mb-2">No reports found</div>
            <div className="text-sm">Generate your first report to see it here</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => (
              <div
                key={report.id}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-5 hover:bg-white/15 transition-all border border-white/10 hover:border-purple-500/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {report.isPinned && <span className="text-yellow-400">📌</span>}
                      <h3 className="text-lg font-semibold text-white">
                        {report.title || 'AHK Performance Report'}
                      </h3>
                      <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs">
                        {report.type || 'Strategic'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-3">
                      {report.summary || 'Comprehensive strategic analysis and performance metrics'}
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                      <span>🕒 {formatDate(report.createdAt)}</span>
                      <span>👁️ {report.views || 0} views</span>
                      {report.lastViewed && (
                        <span>Last viewed: {formatDate(report.lastViewed)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleTogglePin(report.id)}
                      className={`p-2 rounded-lg transition-all ${
                        report.isPinned 
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                      title={report.isPinned ? 'Unpin' : 'Pin'}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleView(report)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-all"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>💡 Reports are automatically deleted after 30 days unless pinned</p>
        </div>
      </div>
    </div>
  );
}
