'use client';

import React, { useState } from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { Image as ImageIcon, User, AlertCircle, RotateCcw } from 'lucide-react';

interface PortraitsCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const PortraitsCanvas: React.FC<PortraitsCanvasProps> = ({ project, onRunStep }) => {
  const characters = project.outputs?.characters || [];
  const stepStates = project.stepStates || [];
  const step3State = stepStates.find(s => s.stepNumber === 3);
  const isFailed = step3State?.status === 'failed';
  const rawError = step3State?.error;

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (charId: string) => {
    setFailedImages(prev => ({ ...prev, [charId]: true }));
  };

  const hasPortraits = characters.some(c => c.portraitFilename);

  // 1. Failed State: Render Central Error Card
  if (isFailed && !hasPortraits) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-ui space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-error-bg border border-error/40 rounded-md flex items-center justify-center text-error shadow-card">
          <AlertCircle className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="label-sm text-[10px] text-error font-bold tracking-widest uppercase">Act 03 Execution Interrupted</span>
          <h3 className="font-display font-bold text-2xl text-paper">Failed to Render Portraits</h3>
          <p className="text-xs font-body text-error/90 bg-error-bg/50 border border-error/30 p-3.5 rounded-sm leading-relaxed text-left">
            {rawError || 'Gemini API call failed or timed out. Your previous step outputs are safely preserved.'}
          </p>
        </div>
        <button
          onClick={() => onRunStep(3)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-error hover:bg-error/90 text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Act 03 (Portraits)</span>
        </button>
      </div>
    );
  }

  // 2. Pending State: Render Previous Context Preview (Character prompts from Step 2)
  if (!hasPortraits && !isFailed) {
    return (
      <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="label-sm text-[10px] text-oxide">Act 03 — Portrait Rendering</span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper">Generate Character Portraits</h3>
          <p className="text-xs sm:text-sm font-body text-muted leading-relaxed">
            Act 03 uses Gemini image generation to render high-resolution visual portraits for your adult main characters.
          </p>
        </div>

        {/* Previous Context Cards */}
        <div className="bg-charcoal border border-rule rounded-md p-5 space-y-4 shadow-card">
          <span className="label-sm text-[10px] text-muted block">Input Context — Act 02 Extracted Characters</span>
          {characters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {characters.map(char => (
                <div key={char.id} className="bg-obsidian p-4 rounded-sm border border-rule space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-display font-bold text-sm text-paper">{char.name}</h5>
                    <span className="text-[10px] text-oxide font-mono uppercase">Adult Main</span>
                  </div>
                  <p className="text-xs font-body text-muted line-clamp-2">{char.description}</p>
                  <div className="bg-charcoal p-2 rounded-xs border border-rule text-[11px] text-paper/80 font-mono line-clamp-2">
                    {char.imagePrompt}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No characters found.</p>
          )}
        </div>

        {/* Primary Run Step CTA */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onRunStep(3)}
            className="px-6 py-3.5 bg-oxide hover:bg-oxide-hover text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Generate Act 03 Character Portraits</span>
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
          <span className="label-sm text-[10px] block">Act 03 Output</span>
          <h3 className="font-display font-bold text-2xl text-paper">Character Portrait Gallery</h3>
        </div>
        {isFailed && (
          <div className="px-3 py-1 bg-error/20 border border-error text-error text-xs font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Generation Failed
          </div>
        )}
      </div>

      {/* Large Editorial Portrait Grid (1 or 2 Large Artwork Frames) */}
      <div className={`grid grid-cols-1 ${characters.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-8`}>
        {characters.map(char => {
          const rawTarget = char.portraitFilename || (char as any).portraitUrl;
          const mediaUrl = rawTarget ? api.getMediaUrl(project._id, rawTarget) : null;
          const hasError = failedImages[char.id];

          return (
            <div
              key={char.id}
              className="bg-charcoal border border-rule rounded-md overflow-hidden shadow-card hover:shadow-card-hover transition duration-base flex flex-col"
            >
              {/* Controlled Portrait Image Frame */}
              <div className="w-full h-52 sm:h-60 bg-obsidian relative overflow-hidden border-b border-rule flex items-center justify-center shrink-0">
                {mediaUrl && !hasError ? (
                  <img
                    src={mediaUrl}
                    alt={char.name}
                    onError={() => handleImageError(char.id)}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="p-6 text-center flex flex-col items-center justify-center space-y-2 text-muted">
                    <div className="w-10 h-10 rounded-full bg-sunken border border-rule flex items-center justify-center text-faint">
                      <ImageIcon className="w-5 h-5 stroke-[1.2]" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold block text-paper">
                        {hasError ? 'Portrait Load Failed' : 'Portrait Pending'}
                      </span>
                      <p className="text-[11px] font-body text-muted/80 mt-1 max-w-xs leading-relaxed">
                        {isFailed
                          ? 'Rate limit exceeded during generation. Click Retry on Control Desk.'
                          : 'Run Act 03 to render this portrait image.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Character Details & Full Prompt Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-display font-bold text-xl text-paper">{char.name}</h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-oxide font-ui">Adult Main Character</span>
                  </div>
                  <p className="text-xs font-body text-paper/90 leading-relaxed">{char.description}</p>
                </div>

                <div className="pt-3 border-t border-rule font-mono text-xs space-y-1.5">
                  <span className="label-sm text-[9px] block text-muted">Generated Image Prompt</span>
                  <div className="bg-obsidian p-3 rounded-xs border border-rule text-[11px] text-paper/90 leading-relaxed select-text">
                    {char.imagePrompt}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
