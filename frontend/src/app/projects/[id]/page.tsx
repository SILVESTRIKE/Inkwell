'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  '3. Character Portraits',
  '4. Chapter Scenes',
  '5. Scene Illustrations',
];

function cleanErrorMessage(rawError?: string): string {
  if (!rawError) return 'Execution encountered an unexpected error. Please retry.';

  if (rawError.includes('429') || rawError.includes('quota') || rawError.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API rate limit exceeded (429). Please wait ~30 seconds before retrying.';
  }

  if (rawError.includes('{') && rawError.includes('}')) {
    try {
      const jsonStart = rawError.indexOf('{');
      const jsonEnd = rawError.lastIndexOf('}') + 1;
      const jsonStr = rawError.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      if (parsed.error?.message) {
        const firstLine = parsed.error.message.split('\n')[0].replace(/^\*\s*/, '');
        return `Gemini API Error: ${firstLine}`;
      }
    } catch {
      // Fallback
    }
  }

  return rawError.length > 200 ? `${rawError.substring(0, 200)}...` : rawError;
}

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

  // Polling hook every 3s if step is running
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 font-ui text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-oxide" />
        <p className="text-xs uppercase tracking-wider font-semibold">Loading project pipeline...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-error-bg border border-error/30 rounded-md p-6 text-center space-y-3 font-ui max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-error mx-auto" />
        <h3 className="text-sm font-semibold text-error">Project Not Found or Access Denied</h3>
        <p className="text-xs text-muted">{error || 'Could not fetch project details.'}</p>
        <Link
          href="/projects"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-charcoal text-paper border border-rule rounded-sm text-xs font-medium hover:bg-obsidian transition duration-fast"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const stepStates = project.stepStates || [];

  // Determine current active or next pending step
  const nextPendingStep = stepStates.find(s => s.status === 'pending')?.stepNumber || 5;
  const currentStepNumber = selectedStep !== null ? selectedStep : (runningStep || nextPendingStep);

  const currentStepState: StepState | undefined = stepStates.find(
    s => s.stepNumber === currentStepNumber
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/projects"
            className="p-1.5 bg-charcoal hover:bg-obsidian text-muted hover:text-paper rounded-md border border-rule transition duration-fast"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-display font-bold text-paper flex items-center gap-2">
              {project.title}
              <span className="text-[11px] font-ui font-normal px-2 py-0.5 rounded-sm bg-oxide-soft text-oxide border border-rule capitalize">
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
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-charcoal hover:bg-obsidian text-muted hover:text-paper rounded-md border border-rule text-xs font-ui transition duration-fast cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-oxide" />
          <span>{showBookText ? 'Hide Book Text' : 'View Full Book Text'}</span>
          {showBookText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Book Text Drawer */}
      {showBookText && (
        <div className="bg-charcoal border border-rule rounded-md p-5 shadow-card font-ui">
          <div className="flex items-center justify-between mb-3 border-b border-rule pb-2">
            <h4 className="text-xs font-semibold text-paper flex items-center gap-2">
              <FileText className="w-4 h-4 text-oxide" /> Full Book Text Content
            </h4>
            <span className="text-xs text-faint font-mono">
              {project.bookText.length} characters
            </span>
          </div>
          <pre className="text-xs font-body text-paper whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed bg-obsidian p-4 rounded-sm border border-rule book-measure">
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
        <div className="bg-oxide-soft border border-rule rounded-md p-4 flex items-center space-x-3 text-paper font-ui">
          <Loader2 className="w-4 h-4 animate-spin text-oxide shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-oxide">
              {STEP_NAMES[runningStep - 1]} is running...
            </h4>
            <p className="text-xs text-muted">
              Gemini model call in progress (10–30s). UI will update automatically when completed.
            </p>
          </div>
        </div>
      )}

      {/* Quota Fallback Notice Banner */}
      {currentStepState?.status === 'done' && currentStepState.error?.startsWith('Notice:') && (
        <div className="bg-oxide-soft border border-oxide/40 rounded-md p-4 flex items-center space-x-3 text-paper font-ui shadow-card">
          <AlertCircle className="w-5 h-5 text-oxide shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-oxide uppercase tracking-wider">
              Gemini API Quota Limit Reached (429) — Fallback Asset Generated
            </h4>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Your free-tier Gemini API quota limit was reached. A fallback placeholder storybook asset was generated so you can continue testing the 5-act pipeline without getting blocked.
            </p>
          </div>
        </div>
      )}

      {/* Error & Retry State Banner */}
      {currentStepState?.status === 'failed' && (
        <div className="bg-error-bg border border-error/30 rounded-md p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-error font-ui shadow-card">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold">
                {STEP_NAMES[currentStepNumber - 1]} Failed
              </h4>
              <p className="text-xs opacity-95 leading-relaxed font-medium">
                {cleanErrorMessage(currentStepState.error)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleRunStep(currentStepNumber)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-error text-paper rounded-sm text-xs font-medium shadow-card hover:opacity-90 transition duration-fast cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Step {currentStepNumber}</span>
            </button>

            <button
              onClick={() => handleRecoverStuckStep(currentStepNumber)}
              disabled={recovering}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-obsidian text-muted hover:text-paper border border-rule rounded-sm text-xs transition duration-fast cursor-pointer"
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
        <div className="bg-charcoal border border-rule rounded-md p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-ui">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-oxide uppercase tracking-wider">
              {currentStepState?.status === 'done' ? 'Re-run Step' : 'Pipeline Step'}
            </span>
            <h3 className="text-xl font-display font-bold text-paper">
              {STEP_NAMES[currentStepNumber - 1]}
            </h3>
            <p className="text-sm font-body text-muted max-w-xl leading-relaxed">
              {currentStepNumber === 1 && 'Propose an art style or supply your own custom storybook style.'}
              {currentStepNumber === 2 && 'Identify max 2 adult main characters with visual portrait prompts.'}
              {currentStepNumber === 3 && 'Generate portrait images for each extracted adult character.'}
              {currentStepNumber === 4 && 'Identify max 1 main chapter illustration prompt.'}
              {currentStepNumber === 5 && 'Generate scene illustration reusing character portraits.'}
            </p>

            {/* Step 1 optional user style input */}
            {currentStepNumber === 1 && (
              <div className="pt-3 max-w-md">
                <label className="block label-sm mb-1.5">
                  Optional Custom Art Style (Leave blank for AI generation)
                </label>
                <input
                  type="text"
                  value={userStyle}
                  onChange={e => setUserStyle(e.target.value)}
                  placeholder="e.g. Victorian Oil Painting or Whimsical Ink Sketch"
                  className="w-full px-3.5 py-2 bg-obsidian border border-rule-strong rounded-sm text-xs text-paper placeholder-faint focus:outline-none focus:border-oxide transition duration-fast"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunStep(currentStepNumber)}
            className="flex items-center space-x-2 px-6 py-3 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run {STEP_NAMES[currentStepNumber - 1]}</span>
          </button>
        </div>
      )}

      {/* Generated Outputs Display Sections */}
      {/* 1. Art Style Output */}
      {project.outputs?.style && (
        <div className="bg-charcoal border border-rule rounded-md p-6 shadow-card space-y-4 font-ui">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-oxide" />
            <span className="label-sm">Act 01 Output — Art Style</span>
          </div>
          <div className="bg-obsidian p-5 rounded-sm border border-rule">
            <h4 className="text-xl font-display font-bold text-paper mb-2">
              {project.outputs.style.styleName}
            </h4>
            <p className="text-sm font-body text-paper/90 leading-relaxed max-w-2xl">
              {project.outputs.style.description}
            </p>
          </div>
        </div>
      )}

      {/* 2 & 3. Characters & Portraits Output */}
      {project.outputs?.characters && project.outputs.characters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between font-ui">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-oxide" />
              <span className="label-sm">Act 02 & 03 Outputs — Adult Main Characters</span>
            </div>
            <span className="text-xs text-muted font-mono">{project.outputs.characters.length} / Max 2</span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {project.outputs.characters.map(char => (
              <CharacterCard key={char.id} projectId={project._id} character={char} />
            ))}
          </div>
        </div>
      )}

      {/* 4 & 5. Chapters & Scene Illustrations Output */}
      {project.outputs?.chapters && project.outputs.chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between font-ui">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-oxide" />
              <span className="label-sm">Act 04 & 05 Outputs — Chapter Scenes</span>
            </div>
            <span className="text-xs text-muted font-mono">{project.outputs.chapters.length} / Max 1</span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {project.outputs.chapters.map(ch => (
              <ChapterCard key={ch.id} projectId={project._id} chapter={ch} />
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Completion Banner */}
      {project.overallStatus === 'done' && (
        <div className="bg-charcoal border border-success/40 rounded-md p-6 text-center space-y-2 shadow-card font-ui">
          <div className="w-10 h-10 bg-success/15 border border-success/40 rounded-md flex items-center justify-center text-success mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-display font-bold text-paper">Storybook Pipeline Complete</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            All 5 steps have successfully generated character portraits and chapter scene illustrations.
          </p>
        </div>
      )}
    </div>
  );
}
