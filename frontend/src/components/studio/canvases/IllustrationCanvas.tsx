'use client';

import React, { useState } from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { Image as ImageIcon, AlertCircle, RotateCcw } from 'lucide-react';

interface IllustrationCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const IllustrationCanvas: React.FC<IllustrationCanvasProps> = ({ project, onRunStep }) => {
  const chapters = project.outputs?.chapters || [];
  const primaryChapter = chapters[0];
  const characters = project.outputs?.characters || [];
  const stepStates = project.stepStates || [];
  const step5State = stepStates.find(s => s.stepNumber === 5);
  const isFailed = step5State?.status === 'failed';
  const rawError = step5State?.error;

  const [imageError, setImageError] = useState(false);

  const rawTarget = primaryChapter?.illustrationFilename;
  const mediaUrl = rawTarget ? api.getMediaUrl(project._id, rawTarget) : null;

  // 1. Failed State: Render Central Error Card
  if (isFailed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-ui space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-error-bg border border-error/40 rounded-md flex items-center justify-center text-error shadow-card">
          <AlertCircle className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="label-sm text-[10px] text-error font-bold tracking-widest uppercase">Act 05 Execution Interrupted</span>
          <h3 className="font-display font-bold text-2xl text-paper">Failed to Generate Illustration</h3>
          <p className="text-xs font-body text-error/90 bg-error-bg/50 border border-error/30 p-3.5 rounded-sm leading-relaxed text-left">
            {rawError || 'Gemini API call failed or timed out. Your previous step outputs are safely preserved.'}
          </p>
        </div>
        <button
          onClick={() => onRunStep(5)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-error hover:bg-error/90 text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Act 05 (Illustration)</span>
        </button>
      </div>
    );
  }

  // 2. Pending State: Render Previous Context Preview (Portraits from Step 3 + Chapter from Step 4)
  if (!primaryChapter || !mediaUrl) {
    return (
      <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="label-sm text-[10px] text-oxide">Act 05 — Scene Rendering</span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper">Create Final Story Illustration</h3>
          <p className="text-xs sm:text-sm font-body text-muted leading-relaxed">
            Act 05 merges your Step 3 character portraits with Step 4's chapter scene prompt to generate a full-frame illustration with character visual consistency.
          </p>
        </div>

        {/* Previous Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Step 3 Portraits Context */}
          <div className="bg-charcoal border border-rule rounded-md p-4 space-y-3 shadow-card">
            <span className="label-sm text-[10px] text-muted block">Input Context — Act 03 Character Portraits</span>
            {characters.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {characters.map((char, idx) => (
                  <div key={idx} className="bg-obsidian p-2 rounded-xs border border-rule flex items-center space-x-2">
                    {char.portraitFilename ? (
                      <img
                        src={api.getMediaUrl(project._id, char.portraitFilename)}
                        alt={char.name}
                        className="w-8 h-8 rounded-xs object-cover shrink-0 border border-rule"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-charcoal rounded-xs flex items-center justify-center text-muted shrink-0 text-xs font-bold">
                        {char.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="font-display font-bold text-xs text-paper truncate">{char.name}</h5>
                      <span className="text-[10px] text-muted block capitalize">Adult Main</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No portraits found.</p>
            )}
          </div>

          {/* Step 4 Chapter Context */}
          <div className="bg-charcoal border border-rule rounded-md p-4 space-y-3 shadow-card">
            <span className="label-sm text-[10px] text-muted block">Input Context — Act 04 Chapter Scene</span>
            {primaryChapter ? (
              <div className="space-y-1.5">
                <h5 className="font-display font-bold text-sm text-paper">{primaryChapter.chapterTitle}</h5>
                <p className="text-xs font-body text-paper/80 line-clamp-3 italic">"{primaryChapter.description}"</p>
              </div>
            ) : (
              <p className="text-xs text-muted italic">No chapter prompt found.</p>
            )}
          </div>
        </div>

        {/* Primary Run Step CTA */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => onRunStep(5)}
            className="px-6 py-3.5 bg-oxide hover:bg-oxide-hover text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Generate Act 05 Scene Illustration</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div>
          <span className="label-sm text-[10px] block">Act 05 — Final Story Artwork</span>
          <h3 className="font-display font-bold text-2xl text-paper">Chapter Scene Illustration</h3>
        </div>
        <button
          onClick={() => onRunStep(5)}
          className="px-3.5 py-1.5 bg-charcoal hover:bg-obsidian text-paper border border-rule rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast cursor-pointer flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Regenerate Scene</span>
        </button>
      </div>

      {/* Large Full-Frame Artwork Showcase */}
      <div className="bg-charcoal border border-rule rounded-md overflow-hidden shadow-card flex flex-col">
        <div className="w-full aspect-[16/10] bg-obsidian relative overflow-hidden border-b border-rule flex items-center justify-center">
          {!imageError ? (
            <img
              src={mediaUrl}
              alt={primaryChapter.chapterTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 text-muted">
              <AlertCircle className="w-8 h-8 text-error stroke-[1.5]" />
              <span className="text-xs uppercase tracking-wider font-semibold text-paper">
                Failed to load illustration asset
              </span>
            </div>
          )}
        </div>

        {/* Story Details Footer */}
        <div className="p-6 space-y-3">
          <h4 className="font-display font-bold text-2xl text-paper">{primaryChapter.chapterTitle}</h4>
          <p className="text-sm font-body text-paper/90 leading-relaxed max-w-3xl border-l-2 border-oxide pl-4 py-1">
            "{primaryChapter.description}"
          </p>

          <div className="pt-4 border-t border-rule font-mono text-xs text-muted space-y-1">
            <span className="label-sm text-[10px] block">Scene Illustration Prompt</span>
            <p className="leading-relaxed bg-obsidian p-3 rounded-xs border border-rule text-[11px]">
              {primaryChapter.illustrationPrompt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
