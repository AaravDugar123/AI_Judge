import React, { useState } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { api, withLoading } from '../services/api';
import toast from 'react-hot-toast';
import type { UploadSubmissionData, ApiStatus } from '../types';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [serverStatus, setServerStatus] = useState<ApiStatus | null>(null);

  // Check server status on component mount
  React.useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await api.get<ApiStatus>('/');
      setServerStatus(response.data);
    } catch (error) {
      setServerStatus({ ok: false, service: 'ai-judge-backend', error: 'Server not reachable' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }

    try {
      setUploadStatus('uploading');
      
      const text = await file.text();
      let jsonData: UploadSubmissionData | UploadSubmissionData[];
      
      try {
        jsonData = JSON.parse(text);
      } catch (parseError: any) {
        toast.error(`Invalid JSON format: ${parseError.message}. Make sure your file starts with [ and ends with ]`);
        setUploadStatus('error');
        return;
      }

      // Ensure we have an array
      const submissions = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      // Validate the structure
      const isValid = submissions.every(sub => 
        sub.id && 
        sub.questions && 
        Array.isArray(sub.questions) &&
        sub.answers && 
        typeof sub.answers === 'object'
      );

      if (!isValid) {
        toast.error('Invalid submission format. Expected submissions with id, questions, and answers.');
        setUploadStatus('error');
        return;
      }

      const result = await withLoading(
        () => api.post('/submissions/import', submissions),
        `Uploading ${submissions.length} submission(s)...`
      );

      setUploadedCount(result.data.imported);
      setUploadStatus('success');
      toast.success(`Successfully imported ${result.data.imported} submissions!`);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast.error('Upload failed. Please check the file format and try again.');
    }
  };

  const generateSampleData = () => {
    const sampleData: UploadSubmissionData[] = [
      {
        id: "sample_sub_1",
        queueId: "demo_queue",
        labelingTaskId: "demo_task",
        createdAt: Date.now(),
        questions: [
          {
            rev: 1,
            data: {
              id: "q_math_1",
              questionType: "single_choice_with_reasoning",
              questionText: "What is 2 + 2?"
            }
          },
          {
            rev: 1,
            data: {
              id: "q_logic_1",
              questionType: "single_choice_with_reasoning", 
              questionText: "Is it possible for something to be both true and false at the same time?"
            }
          }
        ],
        answers: {
          "q_math_1": {
            choice: "4",
            reasoning: "Basic arithmetic: 2 + 2 equals 4"
          },
          "q_logic_1": {
            choice: "No",
            reasoning: "According to the law of non-contradiction, something cannot be both true and false simultaneously in the same context."
          }
        }
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-submissions.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample file downloaded!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Submissions</h1>
          <p className="text-gray-600 mt-1">Import JSON files containing submissions for AI evaluation</p>
        </div>
        <button
          onClick={generateSampleData}
          className="btn-secondary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Sample
        </button>
      </div>

      {/* Server Status */}
      {serverStatus && (
        <div className={`card ${serverStatus.ok ? 'border-success-200 bg-success-50' : 'border-error-200 bg-error-50'}`}>
          <div className="flex items-center">
            {serverStatus.ok ? (
              <CheckCircle2 className="w-5 h-5 text-success-600 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error-600 mr-3" />
            )}
            <div>
              <p className={`font-medium ${serverStatus.ok ? 'text-success-800' : 'text-error-800'}`}>
                {serverStatus.ok ? 'Backend Connected' : 'Backend Disconnected'}
              </p>
              <p className={`text-sm ${serverStatus.ok ? 'text-success-600' : 'text-error-600'}`}>
                Service: {serverStatus.service}
                {serverStatus.database && ` • Database: ${serverStatus.database}`}
                {serverStatus.error && ` • Error: ${serverStatus.error}`}
              </p>
            </div>
          </div>
          {!serverStatus.ok && (
            <button
              onClick={checkServerStatus}
              className="btn-primary mt-3"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div className="space-y-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : uploadStatus === 'success'
              ? 'border-success-500 bg-success-50'
              : uploadStatus === 'error'
              ? 'border-error-500 bg-error-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadStatus === 'uploading'}
          />
          
          <div className="space-y-4">
            {uploadStatus === 'uploading' ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : uploadStatus === 'success' ? (
              <CheckCircle2 className="w-12 h-12 text-success-600 mx-auto" />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="w-12 h-12 text-error-600 mx-auto" />
            ) : (
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto" />
            )}
            
            <div>
              {uploadStatus === 'uploading' ? (
                <p className="text-lg font-medium text-gray-700">Uploading...</p>
              ) : uploadStatus === 'success' ? (
                <>
                  <p className="text-lg font-medium text-success-700">Upload Successful!</p>
                  <p className="text-success-600">Imported {uploadedCount} submissions</p>
                </>
              ) : uploadStatus === 'error' ? (
                <p className="text-lg font-medium text-error-700">Upload Failed</p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-700">Drop your JSON file here</p>
                  <p className="text-gray-500">or click to select a file</p>
                </>
              )}
            </div>
            
            {uploadStatus === 'idle' && (
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Accepts .json files only</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">File Format Requirements</h3>
          <div className="prose prose-sm text-gray-600">
            <p>Your JSON file should contain an array of submission objects with the following structure:</p>
            <ul>
              <li><code>id</code>: Unique submission identifier</li>
              <li><code>queueId</code> (optional): Queue identifier</li>
              <li><code>labelingTaskId</code> (optional): Task identifier</li>
              <li><code>createdAt</code> (optional): Timestamp in milliseconds</li>
              <li><code>questions</code>: Array of question objects</li>
              <li><code>answers</code>: Object mapping question IDs to answer data</li>
            </ul>
            <p>Each question should have an <code>id</code>, <code>questionType</code>, and <code>questionText</code>.</p>
            <p>Each answer should include a <code>choice</code> and optional <code>reasoning</code>.</p>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Next Steps</h3>
            <p className="text-primary-700 mb-4">
              Your submissions have been uploaded successfully. You can now:
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/judges'}
                className="btn-primary"
              >
                Create AI Judges
              </button>
              <button
                onClick={() => window.location.href = '/queue'}
                className="btn-secondary"
              >
                Assign Judges
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
