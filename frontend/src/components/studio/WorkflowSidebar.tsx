'use client';

import React from 'react';
import { StepState, ProjectData } from '@/lib/api-client';
import { Check, AlertCircle, FileText, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface WorkflowSidebarProps {
  project: ProjectData;
  selectedStep: number;
  onSelectStep: (stepNumber: number) => void;
  onOpenBookDrawer: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ACT_DEFINITIONS = [
  { stepNumber: 1, numStr: '01', name: 'STYLE', subtitle: 'Define Visual Direction' },
  { stepNumber: 2, numStr: '02', name: 'CHARACTERS', subtitle: 'Discover Main Cast' },
  { stepNumber: 3, numStr: '03', name: 'PORTRAITS', subtitle: 'Generate Visual Portraits' },
  { stepNumber: 4, numStr: '04', name: 'CHAPTERS', subtitle: 'Analyze Scene Prompts' },
  { stepNumber: 5, numStr: '05', name: 'ILLUSTRATIONS', subtitle: 'Create Final Story Artwork' },
];

function getActSummary(stepNumber: number, project: ProjectData, status: string): string {
  if (status === 'failed') return 'Execution Failed';
  if (status === 'running') return 'Gemini Processing...';
  if (status === 'pending') return 'Waiting to run';

  const outputs = project.outputs || {};
  switch (stepNumber) {
    case 1:
      return outputs.style?.styleName || 'Art style defined';
    case 2:
      return outputs.characters?.length ? `${outputs.characters.length} characters found` : 'Cast discovered';
    case 3:
      const portraitCount = outputs.characters?.filter(c => c.portraitFilename).length || 0;
      return portraitCount > 0 ? `${portraitCount} portraits generated` : 'Portraits ready';
    case 4:
      return outputs.chapters?.length ? `${outputs.chapters.length} chapter prompt ready` : 'Chapter scene ready';
    case 5:
      const illusCount = outputs.chapters?.filter(c => c.illustrationFilename).length || 0;
      return illusCount > 0 ? 'Final artwork generated' : 'Scene artwork ready';
    default:
      return 'Completed';
  }
}

import { isStepUnlocked } from '@/lib/step-utils';

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  project,
  selectedStep,
  onSelectStep,
  onOpenBookDrawer,
  isCollapsed,
  onToggleCollapse,
}) => {
  const stepStates = project.stepStates || [];
  const unlocked = (stepNum: number) => isStepUnlocked(stepNum, stepStates);

  return (
    <aside
      className={`bg-charcoal border-r border-rule flex flex-col justify-between transition-all duration-base font-ui h-full shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-64 lg:w-72'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-rule flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <div>
            <span className="label-sm text-[10px] block">Pipeline Acts</span>
            <h3 className="font-display font-bold text-sm text-paper">Workflow Index</h3>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-muted hover:text-paper bg-obsidian hover:bg-sunken border border-rule rounded-sm transition duration-fast cursor-pointer mx-auto sm:mx-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 5-Act Vertical Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-2 overflow-y-auto">
        {ACT_DEFINITIONS.map(act => {
          const state: StepState | undefined = stepStates.find(s => s.stepNumber === act.stepNumber);
          const status = state?.status || 'pending';
          const isSelected = selectedStep === act.stepNumber;
          const isUnlocked = unlocked(act.stepNumber);
          const summary = getActSummary(act.stepNumber, project, status);

          return (
            <button
              key={act.stepNumber}
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelectStep(act.stepNumber)}
              title={!isUnlocked ? `Requires previous step prerequisites` : summary}
              className={`w-full text-left p-3 rounded-md transition-all duration-fast flex items-start border ${
                status === 'failed'
                  ? 'bg-error/20 border-error text-error'
                  : isSelected
                  ? 'bg-obsidian border-oxide text-paper shadow-card'
                  : status === 'done'
                  ? 'bg-transparent border-transparent hover:bg-obsidian/60 text-paper'
                  : isUnlocked
                  ? 'bg-transparent border-transparent hover:bg-obsidian/40 text-muted'
                  : 'bg-transparent border-transparent text-faint cursor-not-allowed opacity-50'
              }`}
            >
              {/* Step Number Badge & Status Icon */}
              <div className="flex flex-col items-center justify-center mr-3 shrink-0">
                <span
                  className={`font-display text-xl font-bold leading-none ${
                    status === 'failed'
                      ? 'text-error'
                      : isSelected || status === 'running'
                      ? 'text-oxide'
                      : status === 'done'
                      ? 'text-paper'
                      : 'text-faint'
                  }`}
                >
                  {act.numStr}
                </span>

                <div className="mt-1">
                  {status === 'done' && <Check className="w-3.5 h-3.5 text-success" />}
                  {status === 'running' && (
                    <span className="w-2 h-2 rounded-xs bg-oxide animate-pulse block" />
                  )}
                  {status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-error" />}
                  {status === 'pending' && unlocked && <span className="w-1.5 h-1.5 rounded-full bg-faint block" />}
                  {!unlocked && <Lock className="w-3 h-3 text-faint" />}
                </div>
              </div>

              {/* Step Details (Hidden when collapsed) */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block truncate">
                      {act.name}
                    </span>
                  </div>
                  <p className="text-[11px] font-body italic text-muted truncate mt-0.5">
                    {summary}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: View Manuscript Drawer Button */}
      <div className="p-3 border-t border-rule bg-obsidian shrink-0">
        <button
          onClick={onOpenBookDrawer}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 bg-charcoal hover:bg-sunken text-paper border border-rule rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast cursor-pointer ${
            isCollapsed ? 'px-2' : ''
          }`}
          title="Read source book manuscript"
        >
          <FileText className="w-4 h-4 text-oxide shrink-0" />
          {!isCollapsed && <span>Book Text</span>}
        </button>
      </div>
    </aside>
  );
};
