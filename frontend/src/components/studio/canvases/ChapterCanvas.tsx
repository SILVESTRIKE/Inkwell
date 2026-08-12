'use client';

import React from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { BookOpen, ScrollText, AlertCircle, RotateCcw } from 'lucide-react';
import { ChapterCard } from '@/components/cards/ChapterCard';

interface ChapterCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const ChapterCanvas: React.FC<ChapterCanvasProps> = ({ project, onRunStep }) => {
  const chapters = project.outputs?.chapters || [];
  const characters = project.outputs?.characters || [];
  const stepStates = project.stepStates || [];
  const step4State = stepStates.find(s => s.stepNumber === 4);
  const isFailed = step4State?.status === 'failed';
  const rawError = step4State?.error;

  // 1. Failed State: Render Central Error Card
  if (isFailed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-ui space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-error-bg border border-error/40 rounded-md flex items-center justify-center text-error shadow-card">
          <AlertCircle className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="label-sm text-[10px] text-error font-bold tracking-widest uppercase">Act 04 Execution Interrupted</span>
          <h3 className="font-display font-bold text-2xl text-paper">Failed to Formulate Chapter Scene</h3>
          <p className="text-xs font-body text-error/90 bg-error-bg/50 border border-error/30 p-3.5 rounded-sm leading-relaxed text-left">
            {rawError || 'Gemini API call failed or timed out. Your previous step outputs are safely preserved.'}
          </p>
        </div>
        <button
          onClick={() => onRunStep(4)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-error hover:bg-error/90 text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Act 04 (Chapter)</span>
        </button>
      </div>
    );
  }

  // 2. Pending State: Render Previous Context Preview (Characters from Step 2 & 3)
  if (chapters.length === 0) {
    return (
      <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="label-sm text-[10px] text-oxide">Act 04 — Scene Formulation</span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper">Analyze Chapter Illustration Prompt</h3>
          <p className="text-xs sm:text-sm font-body text-muted leading-relaxed">
            Act 04 formulates key chapter scene illustration prompts and narrative summaries based on your extracted characters.
          </p>
        </div>

        {/* Previous Context Cards */}
        <div className="bg-charcoal border border-rule rounded-md p-5 space-y-4 shadow-card">
          <span className="label-sm text-[10px] text-muted block">Input Context — Act 02/03 Adult Main Characters</span>
          {characters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {characters.map(char => {
                const rawTarget = char.portraitFilename || (char as any).portraitUrl;
                const mediaUrl = rawTarget ? api.getMediaUrl(project._id, rawTarget) : null;
                return (
                  <div key={char.id} className="bg-obsidian p-3 rounded-sm border border-rule flex items-center space-x-3">
                    {mediaUrl ? (
                      <img src={mediaUrl} alt={char.name} className="w-10 h-10 rounded-xs object-cover border border-rule shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-charcoal rounded-xs flex items-center justify-center text-oxide font-bold text-sm shrink-0 border border-rule">
                        {char.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="font-display font-bold text-sm text-paper truncate">{char.name}</h5>
                      <p className="text-xs font-body text-muted line-clamp-1">{char.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No characters extracted yet.</p>
          )}
        </div>

        {/* Primary Run Step CTA */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onRunStep(4)}
            className="px-6 py-3.5 bg-oxide hover:bg-oxide-hover text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Generate Act 04 Chapter Prompt</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-center space-x-2.5">
          <ScrollText className="w-5 h-5 text-oxide" />
          <h3 className="font-display font-bold text-xl text-paper">Chapter Scene Analysis</h3>
        </div>
        <span className="text-xs text-muted font-mono">{chapters.length} / Max 1 Chapter Scene</span>
      </div>

      {/* Main Chapter Block */}
      <div className="grid grid-cols-1 gap-6">
        {chapters.map(ch => (
          <ChapterCard key={ch.id} projectId={project._id} chapter={ch} />
        ))}
      </div>

      {/* Referenced Characters (Compact Blocks Below Chapter) */}
      {characters.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-rule">
          <div className="flex items-center justify-between">
            <span className="label-sm text-[10px] block">Referenced Main Characters</span>
            <span className="text-[11px] text-muted font-mono">{characters.length} characters in scene</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map(char => {
              const rawTarget = char.portraitFilename || (char as any).portraitUrl;
              const mediaUrl = rawTarget ? api.getMediaUrl(project._id, rawTarget) : null;

              return (
                <div
                  key={char.id}
                  className="bg-charcoal border border-rule rounded-md p-4 flex items-center space-x-4 shadow-card hover:border-rule-strong transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-obsidian rounded-xs overflow-hidden border border-rule shrink-0 flex items-center justify-center">
                    {mediaUrl ? (
                      <img src={mediaUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-faint stroke-[1.2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-display font-bold text-sm text-paper truncate">{char.name}</h5>
                    <p className="text-xs font-body text-muted line-clamp-2 leading-relaxed mt-0.5">
                      {char.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
