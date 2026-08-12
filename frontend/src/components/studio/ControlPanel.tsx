'use client';

import React from 'react';
import { ProjectData, StepState } from '@/lib/api-client';
import { Play, RotateCcw, RefreshCw, AlertCircle, Loader2, Palette } from 'lucide-react';
import { ACT_DEFINITIONS } from './WorkflowSidebar';

interface ControlPanelProps {
  project: ProjectData;
  selectedStep: number;
  runningStep: number | null;
  userStyle: string;
  onChangeUserStyle: (style: string) => void;
  onRunStep: (stepNum: number) => Promise<void>;
  onRecoverStep: (stepNum: number) => Promise<void>;
  recovering: boolean;
}

function cleanErrorMessage(rawError?: string): string {
  if (!rawError) return 'Execution encountered an error. Please retry.';
  if (rawError.includes('429') || rawError.includes('quota') || rawError.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API rate limit exceeded (429). Please wait ~30 seconds before retrying.';
  }
  return rawError.length > 180 ? `${rawError.substring(0, 180)}...` : rawError;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  project,
  selectedStep,
  runningStep,
  userStyle,
  onChangeUserStyle,
  onRunStep,
  onRecoverStep,
  recovering,
}) => {
  const stepStates = project.stepStates || [];
  const currentAct = ACT_DEFINITIONS.find(a => a.stepNumber === selectedStep) || ACT_DEFINITIONS[0];
  const currentState: StepState | undefined = stepStates.find(s => s.stepNumber === selectedStep);
  const status = currentState?.status || 'pending';

  // Check prerequisites
  const step1Done = stepStates.find(s => s.stepNumber === 1)?.status === 'done';
  const step2Done = stepStates.find(s => s.stepNumber === 2)?.status === 'done';
  const step3Done = stepStates.find(s => s.stepNumber === 3)?.status === 'done';
  const step4Done = stepStates.find(s => s.stepNumber === 4)?.status === 'done';

  let canRun = true;
  let prereqMsg = '';

  if (selectedStep === 2 && !step1Done) {
    canRun = false;
    prereqMsg = 'Requires Act 01 (Style) to be completed first.';
  } else if (selectedStep === 3 && !step2Done) {
    canRun = false;
    prereqMsg = 'Requires Act 02 (Characters) to be completed first.';
  } else if (selectedStep === 4 && (!step1Done || !step2Done)) {
    canRun = false;
    prereqMsg = 'Requires Act 01 (Style) and Act 02 (Characters) to be completed.';
  } else if (selectedStep === 5 && (!step3Done || !step4Done)) {
    canRun = false;
    prereqMsg = 'Requires both Act 03 (Portraits) and Act 04 (Chapters) to be completed.';
  }

  const isRunningThisStep = runningStep === selectedStep;
  const isRunningAnyStep = runningStep !== null;

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-charcoal border-l border-rule flex flex-col justify-between p-5 space-y-6 font-ui h-full shrink-0 overflow-y-auto">
      <div className="space-y-5">
        {/* Desk Header */}
        <div className="border-b border-rule pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="label-sm text-[10px]">Active Control Desk</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                status === 'done'
                  ? 'bg-success/15 text-success border-success/40'
                  : status === 'failed'
                  ? 'bg-error/20 text-error border-error'
                  : status === 'running'
                  ? 'bg-oxide-soft text-oxide border-oxide/40'
                  : 'bg-obsidian text-muted border-rule'
              }`}
            >
              {status}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl text-paper">
            Act {currentAct.numStr} — {currentAct.name}
          </h2>
          <p className="text-xs font-body text-muted mt-1 leading-relaxed">{currentAct.subtitle}</p>
        </div>

        {/* Step Instructions Overview */}
        <div className="bg-obsidian p-3.5 rounded-sm border border-rule space-y-1.5">
          <span className="label-sm text-[10px] block">Act Mandate</span>
          <p className="text-xs font-body text-paper/90 leading-relaxed">
            {selectedStep === 1 && 'Analyze manuscript prose to derive art style parameters.'}
            {selectedStep === 2 && 'Extract max 2 adult main characters with visual prompts.'}
            {selectedStep === 3 && 'Generate high-res portrait artwork for each adult character.'}
            {selectedStep === 4 && 'Generate 1 chapter illustration scene prompt.'}
            {selectedStep === 5 && 'Create scene illustration combining character portraits.'}
          </p>
        </div>

        {/* Optional Custom Style Input for Step 1 */}
        {selectedStep === 1 && (
          <div className="space-y-1.5">
            <label className="block label-sm text-[10px]">
              Custom Art Style (Optional)
            </label>
            <input
              type="text"
              value={userStyle}
              onChange={e => onChangeUserStyle(e.target.value)}
              placeholder="e.g. Victorian Oil Painting"
              className="w-full px-3 py-2 bg-obsidian border border-rule-strong rounded-sm text-xs text-paper placeholder-faint focus:outline-none focus:border-oxide transition duration-fast"
            />
          </div>
        )}

        {/* Defined Art Style Card — Placed Directly Below Act Mandate & Above Execution Button */}
        {project.outputs?.style?.styleName && (
          <div className="bg-obsidian p-3.5 rounded-sm border border-rule space-y-1.5 shadow-card">
            <div className="flex items-center space-x-1.5 text-oxide">
              <Palette className="w-3.5 h-3.5" />
              <span className="label-sm text-[10px]">Defined Art Style</span>
            </div>
            <h5 className="font-display font-bold text-xs text-paper">
              {project.outputs.style.styleName}
            </h5>
            <p className="text-[11px] font-body text-muted line-clamp-3 leading-relaxed">
              {project.outputs.style.description}
            </p>
          </div>
        )}

        {/* Prerequisite Alert */}
        {!canRun && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-amber-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-normal">{prereqMsg}</span>
          </div>
        )}

        {/* Failure Callout Card & Action Buttons */}
        {status === 'failed' && (
          <div className="p-4 bg-error-bg border border-error/40 rounded-md text-error space-y-3 shadow-card">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">Act Execution Failed</h4>
                <p className="text-xs text-error/95 font-medium leading-relaxed">
                  {cleanErrorMessage(currentState?.error)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => onRunStep(selectedStep)}
                disabled={isRunningAnyStep}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-error text-paper rounded-sm text-xs font-bold uppercase tracking-wider hover:opacity-90 transition duration-fast cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Act {selectedStep}</span>
              </button>

              <button
                onClick={() => onRecoverStep(selectedStep)}
                disabled={recovering}
                className="p-2 bg-obsidian text-muted hover:text-paper border border-rule rounded-sm text-xs transition duration-fast cursor-pointer"
                title="Reset step state lock"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* In-Progress Per-Item Indicator Card */}
        {isRunningThisStep && (
          <div className="p-4 bg-oxide-soft border border-oxide/40 rounded-md text-paper space-y-2 font-ui">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-oxide shrink-0" />
              <h4 className="text-xs font-bold text-oxide uppercase tracking-wider">
                Generating Act {selectedStep}...
              </h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Gemini model generating content (10–30s). Viewport will update live on completion.
            </p>
          </div>
        )}

        {/* Primary Execution CTA Button */}
        {status !== 'failed' && (
          <button
            onClick={() => onRunStep(selectedStep)}
            disabled={!canRun || isRunningAnyStep}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-sm text-xs font-bold uppercase tracking-wider transition duration-fast shadow-card ${
              canRun && !isRunningAnyStep
                ? 'bg-oxide hover:bg-oxide-hover text-paper cursor-pointer'
                : 'bg-obsidian text-muted border border-rule cursor-not-allowed opacity-60'
            }`}
          >
            {isRunningThisStep ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Act {selectedStep}...</span>
              </>
            ) : status === 'done' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Act {selectedStep}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Act {selectedStep}</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
