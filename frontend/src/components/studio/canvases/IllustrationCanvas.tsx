'use client';

import React, { useState } from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { Image as ImageIcon, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';

interface IllustrationCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const IllustrationCanvas: React.FC<IllustrationCanvasProps> = ({ project, onRunStep }) => {
  const chapters = project.outputs?.chapters || [];
  const primaryChapter = chapters[0];
  const stepStates = project.stepStates || [];
  const step5State = stepStates.find(s => s.stepNumber === 5);
  const isFailed = step5State?.status === 'failed';

  const [imageError, setImageError] = useState(false);

  const rawTarget = primaryChapter?.illustrationFilename;
  const mediaUrl = rawTarget ? api.getMediaUrl(project._id, rawTarget) : null;

  if (!primaryChapter || !mediaUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Create Final Scene Illustration</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 05 generates the full-frame chapter illustration using Step 3's character portraits to maintain visual consistency.
          </p>
        </div>
        <button
          onClick={() => onRunStep(5)}
          className="px-6 py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Illustration</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-5xl mx-auto p-4 sm:p-6">
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
