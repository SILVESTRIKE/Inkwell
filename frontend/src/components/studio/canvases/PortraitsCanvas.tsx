'use client';

import React, { useState } from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { Image as ImageIcon, Sparkles, User, AlertCircle } from 'lucide-react';

interface PortraitsCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const PortraitsCanvas: React.FC<PortraitsCanvasProps> = ({ project, onRunStep }) => {
  const characters = project.outputs?.characters || [];
  const stepStates = project.stepStates || [];
  const step3State = stepStates.find(s => s.stepNumber === 3);
  const isFailed = step3State?.status === 'failed';

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (charId: string) => {
    setFailedImages(prev => ({ ...prev, [charId]: true }));
  };

  if (characters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <User className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Generate Character Portraits</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 03 renders high-resolution visual portraits for extracted characters using Gemini image generation.
          </p>
        </div>
        <button
          onClick={() => onRunStep(3)}
          className="px-6 py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Portraits</span>
        </button>
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
