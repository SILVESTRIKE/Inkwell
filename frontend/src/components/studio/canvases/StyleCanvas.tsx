'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { Palette, Feather, FileText, AlertCircle, RotateCcw } from 'lucide-react';

interface StyleCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const StyleCanvas: React.FC<StyleCanvasProps> = ({ project, onRunStep }) => {
  const style = project.outputs?.style;
  const stepStates = project.stepStates || [];
  const step1State = stepStates.find(s => s.stepNumber === 1);
  const isFailed = step1State?.status === 'failed';
  const rawError = step1State?.error;

  const manuscriptExcerpt = project.bookText
    ? project.bookText.slice(0, 320) + (project.bookText.length > 320 ? '...' : '')
    : 'No manuscript text available.';

  // 1. Failed State: Render Central Error Card
  if (isFailed && !style?.styleName) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-ui space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-error-bg border border-error/40 rounded-md flex items-center justify-center text-error shadow-card">
          <AlertCircle className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="label-sm text-[10px] text-error font-bold tracking-widest uppercase">Act 01 Execution Interrupted</span>
          <h3 className="font-display font-bold text-2xl text-paper">Failed to Define Art Style</h3>
          <p className="text-xs font-body text-error/90 bg-error-bg/50 border border-error/30 p-3.5 rounded-sm leading-relaxed text-left">
            {rawError || 'Gemini API call failed or timed out. Your manuscript is safely preserved.'}
          </p>
        </div>
        <button
          onClick={() => onRunStep(1)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-error hover:bg-error/90 text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Act 01 (Art Style)</span>
        </button>
      </div>
    );
  }

  // 2. Pending State: Render Previous Context Preview (Manuscript Text)
  if (!style?.styleName) {
    return (
      <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="label-sm text-[10px] text-oxide">Act 01 — Aesthetic Art Direction</span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper">Define Visual Language</h3>
          <p className="text-xs sm:text-sm font-body text-muted leading-relaxed">
            Act 01 analyzes your manuscript prose to derive an aesthetic storybook art direction applied to all character portraits and scene illustrations.
          </p>
        </div>

        {/* Previous Context Card (Book Text Excerpt) */}
        <div className="bg-charcoal border border-rule rounded-md p-5 space-y-3 shadow-card">
          <div className="flex items-center space-x-2 text-oxide">
            <FileText className="w-4 h-4" />
            <span className="label-sm text-[10px]">Input Context — Source Book Manuscript</span>
          </div>
          <div className="bg-obsidian p-4 rounded-sm border border-rule space-y-1.5">
            <h5 className="font-display font-bold text-sm text-paper">{project.title}</h5>
            <p className="text-xs font-body text-paper/80 leading-relaxed italic line-clamp-4">
              "{manuscriptExcerpt}"
            </p>
          </div>
        </div>

        {/* Primary Run Step CTA */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onRunStep(1)}
            className="px-6 py-3.5 bg-oxide hover:bg-oxide-hover text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
          >
            <Palette className="w-4 h-4" />
            <span>Generate Act 01 Art Style</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-3xl mx-auto p-4 sm:p-6">
      {/* Editorial Style Card */}
      <div className="bg-charcoal border border-rule rounded-md p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-5 h-5 text-oxide" />
            <span className="label-sm">Act 01 — Aesthetic Art Direction</span>
          </div>
          <span className="text-xs text-muted font-mono">Defined</span>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-3xl text-paper tracking-tight">
            {style.styleName}
          </h2>
          <p className="text-base font-body text-paper/90 leading-relaxed max-w-2xl border-l-2 border-oxide pl-4 py-1 italic">
            "{style.description}"
          </p>
        </div>

        {style.userStyle && (
          <div className="pt-4 border-t border-rule space-y-1.5">
            <span className="label-sm text-[10px]">Custom User Direction Supplied</span>
            <div className="p-3 bg-obsidian border border-rule rounded-sm text-xs font-mono text-paper">
              {style.userStyle}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-rule flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5 font-body italic">
            <Feather className="w-3.5 h-3.5 text-oxide" /> Applied to character portraits and scene artwork
          </span>
        </div>
      </div>
    </div>
  );
};
