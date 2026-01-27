import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Download, AlertCircle } from 'lucide-react';

const AnalyticsDashboard = ({ eventId }) => {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportFormat, setExportFormat] = useState('summary');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [summaryRes, timelineRes, insightsRes] = await Promise.all([
          fetch(`/api/analytics/event/${eventId}/summary`),
          fetch(`/api/analytics/event/${eventId}/timeline`),
          fetch(`/api/analytics/event/${eventId}/insights`),
        ]);

        if (!summaryRes.ok || !timelineRes.ok || !insightsRes.ok) {
          throw new Error('Failed to load analytics');
        }

        const summaryData = await summaryRes.json();
        const timelineData = await timelineRes.json();
        const insightsData = await insightsRes.json();

        setSummary(summaryData);
        setTimeline(timelineData);
        setInsights(insightsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/analytics/event/${eventId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          type: exportFormat,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers
        .get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || `analytics_${exportFormat}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const participationRate = summary.participation_rate?.toFixed(1) || 0;
  const budgetUtil = summary.budget?.budget_utilization?.toFixed(1) || 0;
  const savings = summary.budget?.budget_remaining || 0;
  const savingsPercent = ((savings / summary.budget?.total_budget) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{summary.event_name}</h1>
          <p className="text-gray-600 mt-2">
            {new Date(summary.event_date).toLocaleDateString()} • {summary.event_type}
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Participation Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Participation</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {participationRate}%
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  {summary.total_collected}/{summary.total_approved} attended
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Budget Utilization Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Budget Utilization</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {budgetUtil}%
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  ₹{summary.budget?.budget_committed?.toLocaleString()} / ₹
                  {summary.budget?.total_budget?.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Savings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Budget Saved</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  ₹{(savings / 100000).toFixed(1)}L
                </p>
                <p className="text-gray-600 text-sm mt-2">{savingsPercent}% savings</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Collection Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Collected</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {summary.total_collected || 0}
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  {summary.performance?.not_collected_count || 0} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Department Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Participation by Department
            </h2>
            <div className="space-y-4">
              {summary.participation?.by_department?.map((dept, idx) => (
                <div key={idx} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{dept.department}</h3>
                    <span className="text-sm font-semibold text-blue-600">
                      {dept.attendance_rate?.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${dept.attendance_rate || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {dept.attended}/{dept.registered} attended
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Options Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Options Popularity
            </h2>
            <div className="space-y-4">
              {summary.participation?.by_option?.map((option, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {option.option_name}
                    </h3>
                    <span className="text-sm font-semibold text-green-600">
                      {option.registered}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (option.registered /
                            Math.max(
                              ...summary.participation.by_option.map(
                                (o) => o.registered
                              )
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {timeline?.timeline && timeline.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Collection Timeline
            </h2>
            <div className="h-48 flex items-end gap-2 justify-around">
              {timeline.timeline.map((entry, idx) => {
                const maxCollections = Math.max(
                  ...timeline.timeline.map((t) => t.collections || 0)
                );
                const height =
                  maxCollections > 0
                    ? ((entry.collections || 0) / maxCollections) * 100
                    : 0;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    ></div>
                    <span className="text-xs text-gray-600 text-center">
                      {entry.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights?.insights && insights.insights.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
            <div className="space-y-3">
              {insights.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-bold flex-shrink-0">•</div>
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 p-2">
                      <span className="text-orange-600 font-bold flex-shrink-0">
                        ▸
                      </span>
                      <p className="text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="summary">Executive Summary</option>
                <option value="participation">Participation Report</option>
                <option value="budget">Budget Report</option>
                <option value="distribution">Distribution Log</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download size={18} />
                {exporting ? 'Exporting...' : 'Export as CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
