// Core data types matching the backend models

export interface Judge {
  id: number;
  name: string;
  prompt: string;
  modelName: string;
  active: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  queueId?: string;
  taskId?: string;
  createdAt?: number;
}

export interface Question {
  id: string;
  submissionId: string;
  rev: number;
  questionType: string;
  questionText: string;
}

export interface Answer {
  id: number;
  submissionId: string;
  questionId: string;
  choice: string;
  reasoning: string;
  extraJson: string;
}

export interface Assignment {
  id: number;
  submissionId: string;
  questionId: string;
  judgeId: number;
}

export interface Evaluation {
  id: number;
  submissionId: string;
  questionId: string;
  judgeId: number;
  verdict: 'pass' | 'fail' | 'inconclusive';
  reasoning: string;
  createdAt: string;
}

// API Response types
export interface EvaluationSummary {
  total: number;
  pass: number;
  passRatePct: number;
}

export interface EvaluationResponse {
  summary: EvaluationSummary;
  items: Evaluation[];
}

export interface EvaluationRunResponse {
  planned: number;
  completed: number;
  failed: number;
}

// Form types for creating new entities
export interface CreateJudgeForm {
  name: string;
  prompt: string;
  modelName: string;
  active: boolean;
}

export interface CreateAssignmentForm {
  submissionId: string;
  questionId: string;
  judgeId: number;
}

// Upload types
export interface UploadSubmissionData {
  id: string;
  queueId?: string;
  labelingTaskId?: string;
  createdAt?: number;
  questions: Array<{
    rev: number;
    data: {
      id: string;
      questionType: string;
      questionText: string;
    };
  }>;
  answers: Record<string, {
    choice: string;
    reasoning: string;
  }>;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Filter types
export interface EvaluationFilters {
  judgeId?: string;
  verdict?: string;
  questionId?: string;
  submissionId?: string;
}

// Chart data types
export interface PassRateChartData {
  name: string;
  passRate: number;
  total: number;
  judge?: string;
}

export interface VerdictDistribution {
  verdict: string;
  count: number;
  percentage: number;
}

// API Status type
export interface ApiStatus {
  ok: boolean;
  service: string;
  database?: string;
  error?: string;
}
