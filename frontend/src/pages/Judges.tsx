import { useState } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff, Save, X, Bot } from 'lucide-react';
import { useApi, useMutation } from '../hooks/useApi';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { Judge, CreateJudgeForm } from '../types';

export default function Judges() {
  const { data: judges, loading, error, refetch } = useApi<Judge[]>('/judges');
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [form, setForm] = useState<CreateJudgeForm>({
    name: '',
    prompt: '',
    modelName: 'gpt-5',
    active: true
  });

  const createMutation = useMutation<{ id: number }, CreateJudgeForm>(
    (data) => api.post('/judges', data)
  );

  const updateMutation = useMutation<{ ok: boolean }, Partial<Judge>>(
    (data) => api.put(`/judges/${editingJudge?.id}`, data)
  );

  const deleteMutation = useMutation<{ ok: boolean }, number>(
    (id) => api.delete(`/judges/${id}`)
  );

  const toggleActiveMutation = useMutation<{ ok: boolean }, { id: number; active: boolean }>(
    ({ id, active }) => api.put(`/judges/${id}`, { active })
  );

  const resetForm = () => {
    setForm({
      name: '',
      prompt: '',
      modelName: 'gpt-5',
      active: true
    });
    setIsCreating(false);
    setEditingJudge(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.prompt.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    if (!form.modelName || !commonModelNames.includes(form.modelName)) {
      toast.error('Please select a valid OpenAI model');
      return;
    }

    const result = await createMutation.mutate(form);
    if (result) {
      toast.success('Judge created successfully!');
      resetForm();
      refetch();
    }
  };

  const handleUpdate = async () => {
    if (!editingJudge || !form.name.trim() || !form.prompt.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    if (!form.modelName || !commonModelNames.includes(form.modelName)) {
      toast.error('Please select a valid OpenAI model');
      return;
    }

    const result = await updateMutation.mutate({
      name: form.name,
      prompt: form.prompt,
      modelName: form.modelName,
      active: form.active
    });

    if (result) {
      toast.success('Judge updated successfully!');
      resetForm();
      refetch();
    }
  };

  const handleDelete = async (judge: Judge) => {
    if (!confirm(`Are you sure you want to delete "${judge.name}"?`)) return;

    const result = await deleteMutation.mutate(judge.id);
    if (result) {
      toast.success('Judge deleted successfully!');
      refetch();
    }
  };

  const handleToggleActive = async (judge: Judge) => {
    const result = await toggleActiveMutation.mutate({
      id: judge.id,
      active: !judge.active
    });

    if (result) {
      toast.success(`Judge ${judge.active ? 'deactivated' : 'activated'}!`);
      refetch();
    }
  };

  const startEdit = (judge: Judge) => {
    setEditingJudge(judge);
    setForm({
      name: judge.name,
      prompt: judge.prompt,
      modelName: judge.modelName,
      active: judge.active
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  // Only OpenAI models are supported (configured with OPENAI_API_KEY)
  const commonModelNames = [
    'gpt-5',
    'gpt-5-turbo',
    'gpt-5-preview',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4',
    'gpt-4-turbo'
  ];

  const samplePrompts = [
    "Grade this answer based on accuracy and completeness. Response format: pass/fail/inconclusive",
    "Evaluate the reasoning quality. Look for logical consistency and evidence-based conclusions.",
    "Check for mathematical correctness and proper methodology in the solution.",
    "Assess the answer for factual accuracy and appropriate depth of explanation."
  ];

  if (loading) return <LoadingSpinner size="lg" message="Loading AI judges..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bot className="w-8 h-8 mr-3 text-primary-600" />
            AI Judges
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage AI judges to evaluate submissions automatically
          </p>
        </div>
        <button onClick={startCreate} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Judge
        </button>
      </div>

      {/* Statistics */}
      {judges && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center">
              <Bot className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-primary-900">{judges.length}</p>
                <p className="text-sm text-primary-600">Total Judges</p>
              </div>
            </div>
          </div>
          <div className="card bg-success-50 border-success-200">
            <div className="flex items-center">
              <Power className="w-8 h-8 text-success-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-success-900">
                  {judges.filter(j => j.active).length}
                </p>
                <p className="text-sm text-success-600">Active Judges</p>
              </div>
            </div>
          </div>
          <div className="card bg-gray-50 border-gray-200">
            <div className="flex items-center">
              <PowerOff className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {judges.filter(j => !j.active).length}
                </p>
                <p className="text-sm text-gray-600">Inactive Judges</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingJudge) && (
        <div className="card bg-gray-50 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isCreating ? 'Create New Judge' : `Edit ${editingJudge?.name}`}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judge Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Math Expert, Logic Checker"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  className="input"
                  value={form.modelName}
                  onChange={e => setForm({...form, modelName: e.target.value})}
                >
                  {commonModelNames.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evaluation Prompt / Rubric *
              </label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Describe how this judge should evaluate submissions..."
                value={form.prompt}
                onChange={e => setForm({...form, prompt: e.target.value})}
              />
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Sample prompts:</p>
                <div className="flex flex-wrap gap-1">
                  {samplePrompts.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => setForm({...form, prompt: sample})}
                      className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
                    >
                      Sample {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  checked={form.active}
                  onChange={e => setForm({...form, active: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700">Active (can be assigned to evaluations)</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                disabled={createMutation.loading || updateMutation.loading}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Create Judge' : 'Update Judge'}
              </button>
              <button onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Judges List */}
      <div className="space-y-4">
        {judges && judges.length > 0 ? (
          judges.map(judge => (
            <div key={judge.id} className={`card transition-all ${judge.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {judge.name}
                    </h3>
                    <span className={`badge ${judge.active ? 'badge-success' : 'badge-gray'}`}>
                      {judge.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="badge badge-gray ml-2">
                      {judge.modelName}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {judge.prompt}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(judge.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(judge)}
                    disabled={toggleActiveMutation.loading}
                    className={`p-2 rounded-lg transition-colors ${
                      judge.active 
                        ? 'text-orange-600 hover:bg-orange-100' 
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={judge.active ? 'Deactivate' : 'Activate'}
                  >
                    {judge.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(judge)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(judge)}
                    disabled={deleteMutation.loading}
                    className="p-2 text-error-600 hover:bg-error-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Judges Yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first AI judge to start evaluating submissions automatically.
            </p>
            <button onClick={startCreate} className="btn-primary">
              Create Your First Judge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
