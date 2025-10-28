import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { EvaluationResponse, Judge, EvaluationFilters } from '../types';

export default function Results() {
  const [filters, setFilters] = useState<EvaluationFilters>({});
  
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters.judgeId) queryParams.append('judgeId', filters.judgeId);
  if (filters.verdict) queryParams.append('verdict', filters.verdict);
  if (filters.questionId) queryParams.append('questionId', filters.questionId);
  if (filters.submissionId) queryParams.append('submissionId', filters.submissionId);

  const { data: evaluations, loading: evalLoading, error: evalError, refetch } = useApi<EvaluationResponse>(
    `/evaluations?${queryParams.toString()}`,
    [filters]
  );
  
  const { data: judges } = useApi<Judge[]>('/judges');

  const handleFilterChange = (key: keyof EvaluationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Prepare chart data
  const verdictData = React.useMemo(() => {
    if (!evaluations?.items) return [];
    const counts = evaluations.items.reduce((acc, item) => {
      acc[item.verdict] = (acc[item.verdict] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([verdict, count]) => ({
      verdict: verdict.charAt(0).toUpperCase() + verdict.slice(1),
      count,
      percentage: ((count / evaluations.items.length) * 100).toFixed(1)
    }));
  }, [evaluations?.items]);

  const judgePerformanceData = React.useMemo(() => {
    if (!evaluations?.items || !judges) return [];
    
    const judgeStats = judges.map(judge => {
      const judgeEvals = evaluations.items.filter(e => e.judgeId === judge.id);
      const passCount = judgeEvals.filter(e => e.verdict === 'pass').length;
      const total = judgeEvals.length;
      
      return {
        name: judge.name,
        passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
        total,
        passed: passCount
      };
    }).filter(j => j.total > 0);

    return judgeStats;
  }, [evaluations?.items, judges]);

  const exportResults = () => {
    if (!evaluations?.items) return;
    
    const csvContent = [
      ['ID', 'Submission', 'Question', 'Judge', 'Verdict', 'Reasoning', 'Created'],
      ...evaluations.items.map(item => [
        item.id,
        item.submissionId,
        item.questionId,
        item.judgeId,
        item.verdict,
        `"${item.reasoning.replace(/"/g, '""')}"`,
        item.createdAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280'];

  if (evalLoading) return <LoadingSpinner size="lg" message="Loading evaluation results..." />;
  if (evalError) return <ErrorMessage message={evalError} onRetry={refetch} />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-primary-600" />
            Results & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            View evaluation results, analytics, and export data
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportResults} className="btn-secondary flex items-center" disabled={!evaluations?.items?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button onClick={refetch} className="btn-primary flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {evaluations?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-primary-900">{evaluations.summary.total}</p>
                <p className="text-sm text-primary-600">Total Evaluations</p>
              </div>
            </div>
          </div>
          <div className="card bg-success-50 border-success-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-success-900">{evaluations.summary.pass}</p>
                <p className="text-sm text-success-600">Passed</p>
              </div>
            </div>
          </div>
          <div className="card bg-warning-50 border-warning-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-warning-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">%</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-900">{evaluations.summary.passRatePct}%</p>
                <p className="text-sm text-warning-600">Pass Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {verdictData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verdict Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ verdict, percentage }) => `${verdict}: ${percentage}%`}
                >
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {judgePerformanceData.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Judge Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={judgePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}%`, 'Pass Rate']} />
                  <Bar dataKey="passRate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Results
          </h3>
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judge</label>
            <select
              className="input text-sm"
              value={filters.judgeId || ''}
              onChange={e => handleFilterChange('judgeId', e.target.value)}
            >
              <option value="">All judges</option>
              {judges?.map(judge => (
                <option key={judge.id} value={judge.id.toString()}>{judge.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verdict</label>
            <select
              className="input text-sm"
              value={filters.verdict || ''}
              onChange={e => handleFilterChange('verdict', e.target.value)}
            >
              <option value="">All verdicts</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="inconclusive">Inconclusive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission ID</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Filter by submission..."
              value={filters.submissionId || ''}
              onChange={e => handleFilterChange('submissionId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Filter by question..."
              value={filters.questionId || ''}
              onChange={e => handleFilterChange('questionId', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Submission</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Question</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Judge</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Verdict</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Reasoning</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {evaluations?.items && evaluations.items.length > 0 ? (
                evaluations.items.map(evaluation => {
                  const judge = judges?.find(j => j.id === evaluation.judgeId);
                  return (
                    <tr key={evaluation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm">{evaluation.submissionId}</td>
                      <td className="py-3 px-2 text-sm">{evaluation.questionId}</td>
                      <td className="py-3 px-2 text-sm">
                        {judge ? (
                          <div>
                            <div className="font-medium">{judge.name}</div>
                            <div className="text-xs text-gray-500">{judge.modelName}</div>
                          </div>
                        ) : (
                          `Judge ${evaluation.judgeId}`
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge ${
                          evaluation.verdict === 'pass' ? 'badge-success' :
                          evaluation.verdict === 'fail' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {evaluation.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm max-w-xs truncate" title={evaluation.reasoning}>
                        {evaluation.reasoning}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500">
                        {new Date(evaluation.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No evaluation results found. Run some evaluations from the Queue page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
