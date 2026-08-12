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
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
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
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

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
      <div className="flex items-center justify-center py-20 text-muted font-ui text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-accent" />
        Loading project pipeline...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 text-muted font-ui">
        <p className="mb-4 text-sm">Project not found.</p>
        <Link href="/projects" className="px-4 py-2 bg-accent text-paper text-xs rounded-sm">
          Back to Projects
        </Link>
      </div>
    );
  }

  // Determine current active or upcoming step number
  const stepStates = project?.stepStates || [];
  const nextPendingStep = [1, 2, 3, 4, 5].find(stepNum => {
    const state = stepStates.find(s => s.stepNumber === stepNum);
    return !state || state.status === 'pending' || state.status === 'failed';
  }) || 5;
  const currentStepNumber = runningStep || selectedStep || nextPendingStep;

  const currentStepState: StepState | undefined = stepStates.find(
    s => s.stepNumber === currentStepNumber
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/projects"
            className="p-1.5 bg-raised hover:bg-paper text-muted hover:text-ink rounded-md border border-border transition duration-fast"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
              {project.title}
              <span className="text-[11px] font-ui font-normal px-2 py-0.5 rounded-sm bg-accent-soft text-accent border border-border capitalize">
                {(project.overallStatus || 'draft').replace('_', ' ')}
              </span>
            </h2>
            <p className="text-xs text-muted font-ui">
              Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBookText(!showBookText)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-raised hover:bg-paper text-muted hover:text-ink rounded-md border border-border text-xs font-ui transition duration-fast"
        >
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span>{showBookText ? 'Hide Book Text' : 'View Full Book Text'}</span>
          {showBookText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Book Text Drawer */}
      {showBookText && (
        <div className="bg-raised border border-border rounded-md p-5 shadow-card font-ui">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <h4 className="text-xs font-semibold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" /> Full Book Text Content
            </h4>
            <span className="text-xs text-faint font-mono">
              {project.bookText.length} characters
            </span>
          </div>
          <pre className="text-xs font-body text-ink whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed bg-paper p-4 rounded-sm border border-border book-measure">
            {project.bookText}
          </pre>
        </div>
      )}

      {/* Stepper Header */}
      <Stepper
        stepStates={stepStates}
        currentStepNumber={currentStepNumber}
        onSelectStep={stepNum => setSelectedStep(stepNum)}
      />

      {/* In-Progress State Banner */}
      {runningStep && (
        <div className="bg-accent-soft border border-border rounded-md p-4 flex items-center space-x-3 text-ink font-ui">
          <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-accent">
              {STEP_NAMES[runningStep - 1]} is running...
            </h4>
            <p className="text-xs text-muted">
              Gemini model call in progress (10–30s). UI will update automatically when completed.
            </p>
          </div>
        </div>
      )}

      {/* Error & Retry State Banner */}
      {currentStepState?.status === 'failed' && (
        <div className="bg-error-bg border border-error/30 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-error font-ui">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold">
                {STEP_NAMES[currentStepNumber - 1]} Failed
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {currentStepState.error || 'Execution encountered an error.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleRunStep(currentStepNumber)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-error text-paper rounded-sm text-xs font-medium shadow-card hover:opacity-90 transition duration-fast"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Step {currentStepNumber}</span>
            </button>

            <button
              onClick={() => handleRecoverStuckStep(currentStepNumber)}
              disabled={recovering}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-paper text-muted hover:text-ink border border-border rounded-sm text-xs transition duration-fast"
              title="Force reset step lock"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Action Trigger Card */}
      {!runningStep && (
        <div className="bg-raised border border-border rounded-md p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-ui">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              {currentStepState?.status === 'done' ? 'Re-run Step' : 'Pipeline Step'}
            </span>
            <h3 className="text-xl font-serif font-bold text-ink">
              {STEP_NAMES[currentStepNumber - 1]}
            </h3>
            <p className="text-xs text-muted max-w-xl">
              {currentStepNumber === 1 && 'Propose an art style or supply your own custom storybook style.'}
              {currentStepNumber === 2 && 'Identify max 2 adult main characters with visual portrait prompts.'}
              {currentStepNumber === 3 && 'Generate portrait images for each extracted adult character.'}
              {currentStepNumber === 4 && 'Identify max 1 main chapter illustration prompt.'}
              {currentStepNumber === 5 && 'Generate scene illustration reusing character portraits.'}
            </p>

            {/* Step 1 optional user style input */}
            {currentStepNumber === 1 && (
              <div className="pt-2 max-w-md">
                <label className="block text-xs font-medium text-muted mb-1">
                  Optional Custom Art Style (Leave blank for AI generation)
                </label>
                <input
                  type="text"
                  value={userStyle}
                  onChange={e => setUserStyle(e.target.value)}
                  placeholder="e.g. Victorian Oil Painting or Whimsical Ink Sketch"
                  className="w-full px-3 py-1.5 bg-paper border border-border-strong rounded-sm text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunStep(currentStepNumber)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-paper font-medium text-xs rounded-sm shadow-card transition duration-fast shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run {STEP_NAMES[currentStepNumber - 1]}</span>
          </button>
        </div>
      )}

      {/* Generated Outputs Display Sections */}
      {/* 1. Art Style Output */}
      {project.outputs?.style && (
        <div className="bg-raised border border-border rounded-md p-5 shadow-card space-y-3 font-ui">
          <div className="flex items-center space-x-2 text-accent">
            <Palette className="w-4 h-4" />
            <h3 className="text-md font-serif font-bold text-ink">Art Style</h3>
          </div>
          <div className="bg-paper p-4 rounded-sm border border-border">
            <h4 className="text-sm font-serif font-semibold text-accent mb-1">
              {project.outputs.style.styleName}
            </h4>
            <p className="text-xs font-body text-muted leading-relaxed">{project.outputs.style.description}</p>
          </div>
        </div>
      )}

      {/* 2 & 3. Characters & Portraits Output */}
      {project.outputs?.characters && project.outputs.characters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-accent font-ui">
            <Users className="w-4 h-4" />
            <h3 className="text-md font-serif font-bold text-ink">
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
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-accent font-ui">
            <BookOpen className="w-4 h-4" />
            <h3 className="text-md font-serif font-bold text-ink">
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
        <div className="bg-raised border border-success/40 rounded-md p-6 text-center space-y-2 shadow-card font-ui">
          <div className="w-10 h-10 bg-success/15 border border-success/40 rounded-md flex items-center justify-center text-success mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-serif font-bold text-ink">Pipeline Complete!</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            All 5 steps have successfully generated character portraits and chapter scene illustrations.
          </p>
        </div>
      )}
    </div>
  );
}
