import React, { useState } from 'react';
import { Play, Users, FileText, ArrowRight, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { useApi, useMutation } from '../hooks/useApi';
import { api, withLoading } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { Judge, Submission, Assignment, EvaluationRunResponse } from '../types';

export default function Queue() {
  const { data: submissions, loading: subsLoading, error: subsError, refetch: refetchSubs } = useApi<Submission[]>('/submissions');
  const { data: judges, loading: judgesLoading, error: judgesError, refetch: refetchJudges } = useApi<Judge[]>('/judges');
  const { data: assignments, loading: assignLoading, error: assignError, refetch: refetchAssignments } = useApi<Assignment[]>('/assignments');

  const [runningEvaluation, setRunningEvaluation] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationRunResponse | null>(null);
  const [clearingAssignments, setClearingAssignments] = useState(false);

  const assignmentMutation = useMutation<{ ok: boolean; id: number }, {
    submissionId: string;
    questionId: string;
    judgeId: number;
  }>((data) => api.post('/assignments', data));

  const runEvaluationsMutation = useMutation<EvaluationRunResponse, { queueId?: string }>(
    (data) => api.post('/evaluations/run', data)
  );

  const handleAssign = async (submissionId: string, questionId: string, judgeId: number) => {
    if (!judgeId || !questionId.trim()) {
      toast.error('Please select a judge and enter a question ID');
      return;
    }

    const result = await assignmentMutation.mutate({
      submissionId,
      questionId: questionId.trim(),
      judgeId
    });

    if (result) {
      toast.success('Assignment created successfully!');
      refetchAssignments();
    }
  };

  const handleRunEvaluations = async (queueId?: string) => {
    setRunningEvaluation(true);
    
    try {
      const result = await withLoading(
        () => runEvaluationsMutation.mutate({ queueId }),
        'Running AI evaluations... This may take a while.'
      );

      if (result) {
        setEvaluationResults(result);
        toast.success(`Evaluations completed! ${result.completed}/${result.planned} successful`);
      }
    } finally {
      setRunningEvaluation(false);
    }
  };

  const handleClearAssignments = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL assignments. Evaluations will remain, but you\'ll need to reassign judges.\n\nAre you sure?')) {
      return;
    }
    
    setClearingAssignments(true);
    try {
      await api.delete('/assignments/clear');
      toast.success('All assignments cleared successfully!');
      refetchAssignments();
    } catch (error: any) {
      toast.error('Failed to clear assignments');
    } finally {
      setClearingAssignments(false);
    }
  };

  const getAssignmentsForSubmission = (submissionId: string) => {
    return assignments?.filter(a => a.submissionId === submissionId) || [];
  };

  const getJudgeName = (judgeId: number) => {
    const judge = judges?.find(j => j.id === judgeId);
    if (!judge) return `Judge ${judgeId} (deleted)`;
    return judge.name;
  };

  const activeJudges = judges?.filter(j => j.active) || [];
  const totalAssignments = assignments?.length || 0;
  const uniqueQueues = [...new Set(submissions?.map(s => s.queueId).filter(Boolean))];

  if (subsLoading || judgesLoading || assignLoading) {
    return <LoadingSpinner size="lg" message="Loading queue data..." />;
  }

  if (subsError || judgesError || assignError) {
    return <ErrorMessage 
      message={subsError || judgesError || assignError || 'Failed to load data'} 
      onRetry={() => {
        refetchSubs();
        refetchJudges();
        refetchAssignments();
      }}
    />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            Assignments
          </h1>
          <p className="text-gray-600 mt-1">
            Assign AI judges to evaluate submissions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleRunEvaluations()}
            disabled={runningEvaluation || totalAssignments === 0}
            className="btn-success flex items-center justify-center px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {runningEvaluation ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Running Evaluations...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run All Evaluations
              </>
            )}
          </button>
          {uniqueQueues.length > 1 && (
            <div className="relative">
              <select
                onChange={(e) => e.target.value && handleRunEvaluations(e.target.value)}
                className="btn-primary flex items-center px-6 py-3 text-base font-semibold cursor-pointer appearance-none pr-10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                disabled={runningEvaluation}
              >
                <option value="">🎯 Run by Specific Queue...</option>
                {uniqueQueues.map(queueId => (
                  <option key={queueId} value={queueId}>Queue: {queueId}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-white">
                ▼
              </div>
            </div>
          )}
          <button
            onClick={handleClearAssignments}
            disabled={clearingAssignments || totalAssignments === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {clearingAssignments ? 'Clearing...' : 'Clear Assignments'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-primary-900">{submissions?.length || 0}</p>
              <p className="text-sm text-primary-600">Submissions</p>
            </div>
          </div>
        </div>
        <div className="card bg-success-50 border-success-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-success-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-success-900">{activeJudges.length}</p>
              <p className="text-sm text-success-600">Active Judges</p>
            </div>
          </div>
        </div>
        <div className="card bg-warning-50 border-warning-200">
          <div className="flex items-center">
            <ArrowRight className="w-8 h-8 text-warning-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-warning-900">{totalAssignments}</p>
              <p className="text-sm text-warning-600">Assignments</p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueQueues.length}</p>
              <p className="text-sm text-gray-600">Queues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Results */}
      {evaluationResults && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-success-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Latest Evaluation Results</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-900">{evaluationResults.planned}</p>
              <p className="text-sm text-primary-600">Planned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-900">{evaluationResults.completed}</p>
              <p className="text-sm text-success-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error-900">{evaluationResults.failed}</p>
              <p className="text-sm text-error-600">Failed</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.location.href = '/results'}
              className="btn-primary w-full"
            >
              View Detailed Results & Reasoning
            </button>
            <p className="text-sm text-gray-600 text-center">
              Click above to see full evaluation reasoning and verdicts
            </p>
          </div>
        </div>
      )}

      {/* No Active Judges Warning */}
      {activeJudges.length === 0 && (
        <div className="card bg-warning-50 border-warning-200">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-warning-600 mr-3" />
            <div>
              <h3 className="font-semibold text-warning-900">No Active Judges</h3>
              <p className="text-warning-700">
                You need to create and activate at least one judge before making assignments.
              </p>
              <button
                onClick={() => window.location.href = '/judges'}
                className="btn-warning mt-2"
              >
                Create Judges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions and Assignments */}
      <div className="space-y-6">
        {submissions && submissions.length > 0 ? (
          submissions.map(submission => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              judges={activeJudges}
              assignments={getAssignmentsForSubmission(submission.id)}
              onAssign={handleAssign}
              getJudgeName={getJudgeName}
              isAssigning={assignmentMutation.loading}
            />
          ))
        ) : (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions</h3>
            <p className="text-gray-500 mb-4">
              Upload JSON submissions first to assign judges for evaluation.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              Upload Submissions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Submission Card Component
interface SubmissionCardProps {
  submission: Submission;
  judges: Judge[];
  assignments: Assignment[];
  onAssign: (submissionId: string, questionId: string, judgeId: number) => void;
  getJudgeName: (judgeId: number) => string;
  isAssigning: boolean;
}

function SubmissionCard({ 
  submission, 
  judges, 
  assignments, 
  onAssign, 
  getJudgeName, 
  isAssigning 
}: SubmissionCardProps) {
  const [questionId, setQuestionId] = useState('');
  const [selectedJudgeId, setSelectedJudgeId] = useState<number>(0);

  const handleAssign = () => {
    onAssign(submission.id, questionId, selectedJudgeId);
    setQuestionId('');
    setSelectedJudgeId(0);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Submission {submission.id}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {submission.queueId && (
              <span className="badge badge-gray">Queue: {submission.queueId}</span>
            )}
            {submission.taskId && (
              <span className="badge badge-gray">Task: {submission.taskId}</span>
            )}
            {submission.createdAt && (
              <span>Created: {new Date(submission.createdAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Existing Assignments */}
      {assignments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</h4>
          <div className="flex flex-wrap gap-2">
            {assignments.map(assignment => (
              <span key={assignment.id} className="badge badge-success">
                {assignment.questionId} → {getJudgeName(assignment.judgeId)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Assignment:</h4>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Question ID
            </label>
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g., q_template_1"
              value={questionId}
              onChange={e => setQuestionId(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Select Judge
            </label>
            <select
              className="input text-sm"
              value={selectedJudgeId}
              onChange={e => setSelectedJudgeId(Number(e.target.value))}
            >
              <option value={0}>Choose a judge...</option>
              {judges && judges.length > 0 ? (
                judges.map(judge => (
                  <option key={judge.id} value={judge.id}>
                    {judge.name} ({judge.modelName || 'No model'})
                  </option>
                ))
              ) : (
                <option disabled>No judges available</option>
              )}
            </select>
          </div>
          <button
            onClick={handleAssign}
            disabled={!selectedJudgeId || !questionId.trim() || isAssigning || judges.length === 0}
            className="btn-primary text-sm"
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter the question template ID from your uploaded JSON data
        </p>
      </div>
    </div>
  );
}
