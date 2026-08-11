'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ProjectData, StepState } from '@/lib/api-client';
import { Stepper } from '@/components/stepper/Stepper';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { ChapterCard } from '@/components/cards/ChapterCard';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  Palette,
  Users,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

const STEP_NAMES = [
  '1. Art Style',
  '2. Extract Characters',
  '3. Generate Portraits',
  '4. Extract Chapters',
  '5. Generate Illustrations',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [userStyle, setUserStyle] = useState('');
  const [showBookText, setShowBookText] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setError('');
      const data = await api.getProject(projectId);
      setProject(data);

      const activeStep = data.stepStates?.find(s => s.status === 'running');
      if (activeStep) {
        setRunningStep(activeStep.stepNumber);
      } else {
        setRunningStep(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId, fetchProject]);

  // Polling hook every 3s if any step is running
  useEffect(() => {
    if (!runningStep) return;
    const interval = setInterval(() => {
      fetchProject();
    }, 3000);
    return () => clearInterval(interval);
  }, [runningStep, fetchProject]);

  const handleRunStep = async (stepNumber: number) => {
    try {
      setRunningStep(stepNumber);
      setError('');
      const updated = await api.runStep(projectId, stepNumber, userStyle);
      // 202 Accepted — job is queued, NOT done.
      // Set project state (step will show 'running') but keep runningStep
      // active so the polling loop handles the done/failed transition.
      setProject(updated);
    } catch (err: any) {
      setError(err.message || `Step ${stepNumber} execution failed`);
      setRunningStep(null);
      await fetchProject();
    }
  };

  const handleRecoverStuckStep = async (stepNumber: number) => {
    try {
      setRecovering(true);
      setError('');
      const updated = await api.recoverStep(projectId, stepNumber);
      setProject(updated);
      setRunningStep(null);
    } catch (err: any) {
      setError(err.message || 'Failed to recover step');
    } finally {
      setRecovering(false);
    }
  };

  if (!user) return <AuthModal />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading project pipeline...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="mb-4">Project not found.</p>
        <Link href="/projects" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Back to Projects
        </Link>
      </div>
    );
  }

  // Determine current active or upcoming step number
  const stepStates = project.stepStates || [];
  const nextPendingStep = [1, 2, 3, 4, 5].find(stepNum => {
    const state = stepStates.find(s => s.stepNumber === stepNum);
    return !state || state.status === 'pending' || state.status === 'failed';
  }) || 5;
  const currentStepNumber = runningStep || nextPendingStep;

  const currentStepState: StepState | undefined = stepStates.find(
    s => s.stepNumber === currentStepNumber
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/projects"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {project.title}
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                {(project.overallStatus || 'draft').replace('_', ' ')}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBookText(!showBookText)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-medium transition"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>{showBookText ? 'Hide Book Text' : 'View Full Book Text'}</span>
          {showBookText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Book Text Drawer */}
      {showBookText && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-inner animate-fadeIn">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Full Book Text Content
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              {project.bookText.length} characters
            </span>
          </div>
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {project.bookText}
          </pre>
        </div>
      )}

      {/* Stepper Header */}
      <Stepper stepStates={stepStates} currentStepNumber={currentStepNumber} />

      {/* In-Progress State Banner (§4.3 Requirement) */}
      {runningStep && (
        <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-4 flex items-center space-x-3 text-indigo-200">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-indigo-300">
              {STEP_NAMES[runningStep - 1]} is running...
            </h4>
            <p className="text-xs text-indigo-400/80">
              Gemini model call in progress (10–30s). UI will update automatically when completed.
            </p>
          </div>
        </div>
      )}

      {/* Error & Retry State Banner */}
      {currentStepState?.status === 'failed' && (
        <div className="bg-rose-950/60 border border-rose-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-300">
                {STEP_NAMES[currentStepNumber - 1]} Failed
              </h4>
              <p className="text-xs text-rose-400/80 mt-0.5">
                {currentStepState.error || 'Execution encountered an error.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => handleRunStep(currentStepNumber)}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Step {currentStepNumber}</span>
            </button>

            {/* Stuck Step Recovery Affordance */}
            <button
              onClick={() => handleRecoverStuckStep(currentStepNumber)}
              disabled={recovering}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              title="Force reset step lock"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Stuck State</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Action Trigger Card */}
      {project.overallStatus !== 'done' && !runningStep && currentStepState?.status !== 'failed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Next Pipeline Step
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {STEP_NAMES[currentStepNumber - 1]}
            </h3>
            <p className="text-xs text-slate-400">
              {currentStepNumber === 1 && 'Propose an art style or supply your own custom storybook style.'}
              {currentStepNumber === 2 && 'Identify max 2 adult main characters with visual portrait prompts.'}
              {currentStepNumber === 3 && 'Generate portrait images for each extracted adult character.'}
              {currentStepNumber === 4 && 'Identify max 1 main chapter illustration prompt.'}
              {currentStepNumber === 5 && 'Generate scene illustration reusing character portraits.'}
            </p>

            {/* Step 1 optional user style input */}
            {currentStepNumber === 1 && (
              <div className="pt-3 max-w-md">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Custom Art Style (Leave blank for AI generation)
                </label>
                <input
                  type="text"
                  value={userStyle}
                  onChange={e => setUserStyle(e.target.value)}
                  placeholder="e.g. Victorian Oil Painting or Whimsical Ink Sketch"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunStep(currentStepNumber)}
            className="flex items-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition duration-200 shrink-0"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Run {STEP_NAMES[currentStepNumber - 1]}</span>
          </button>
        </div>
      )}

      {/* Generated Outputs Display Sections */}
      {/* 1. Art Style Output */}
      {project.outputs?.style && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Palette className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Art Style</h3>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-md font-semibold text-indigo-300 mb-1">
              {project.outputs.style.styleName}
            </h4>
            <p className="text-xs text-slate-300">{project.outputs.style.description}</p>
          </div>
        </div>
      )}

      {/* 2 & 3. Characters & Portraits Output */}
      {project.outputs?.characters && project.outputs.characters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Users className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">
              Adult Main Characters ({project.outputs.characters.length} / Max 2)
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {project.outputs.characters.map(char => (
              <CharacterCard key={char.id} projectId={project._id} character={char} />
            ))}
          </div>
        </div>
      )}

      {/* 4 & 5. Chapters & Scene Illustrations Output */}
      {project.outputs?.chapters && project.outputs.chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">
              Chapter Illustrations ({project.outputs.chapters.length} / Max 1)
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {project.outputs.chapters.map(ch => (
              <ChapterCard key={ch.id} projectId={project._id} chapter={ch} />
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Completion Banner */}
      {project.overallStatus === 'done' && (
        <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Pipeline Complete!</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            All 5 steps have successfully generated character portraits and chapter scene illustrations.
          </p>
        </div>
      )}
    </div>
  );
}
