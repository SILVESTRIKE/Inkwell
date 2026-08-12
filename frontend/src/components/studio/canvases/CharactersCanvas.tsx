'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { Users, UsersRound, Palette, AlertCircle, RotateCcw } from 'lucide-react';
import { CharacterCard } from '@/components/cards/CharacterCard';

interface CharactersCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const CharactersCanvas: React.FC<CharactersCanvasProps> = ({ project, onRunStep }) => {
  const characters = project.outputs?.characters || [];
  const styleOutput = project.outputs?.style;
  const stepStates = project.stepStates || [];
  const step2State = stepStates.find(s => s.stepNumber === 2);
  const isFailed = step2State?.status === 'failed';
  const rawError = step2State?.error;

  // 1. Failed State: Render Central Error Card
  if (isFailed && characters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center font-ui space-y-5 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-error-bg border border-error/40 rounded-md flex items-center justify-center text-error shadow-card">
          <AlertCircle className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="label-sm text-[10px] text-error font-bold tracking-widest uppercase">Act 02 Execution Interrupted</span>
          <h3 className="font-display font-bold text-2xl text-paper">Failed to Extract Characters</h3>
          <p className="text-xs font-body text-error/90 bg-error-bg/50 border border-error/30 p-3.5 rounded-sm leading-relaxed text-left">
            {rawError || 'Gemini API call failed or timed out. Your previous step outputs are safely preserved.'}
          </p>
        </div>
        <button
          onClick={() => onRunStep(2)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-error hover:bg-error/90 text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Act 02 (Characters)</span>
        </button>
      </div>
    );
  }

  // 2. Pending State: Render Previous Context Preview (Step 1 Art Style)
  if (characters.length === 0) {
    return (
      <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="label-sm text-[10px] text-oxide">Act 02 — Cast Extraction</span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper">Discover Adult Story Cast</h3>
          <p className="text-xs sm:text-sm font-body text-muted leading-relaxed">
            Act 02 analyzes your manuscript to extract up to 2 main adult characters along with detailed visual descriptions for portrait rendering.
          </p>
        </div>

        {/* Previous Context Card */}
        <div className="bg-charcoal border border-rule rounded-md p-5 space-y-3 shadow-card">
          <div className="flex items-center space-x-2 text-oxide">
            <Palette className="w-4 h-4" />
            <span className="label-sm text-[10px]">Input Context — Act 01 Defined Art Style</span>
          </div>
          {styleOutput?.styleName ? (
            <div className="space-y-1.5 bg-obsidian p-4 rounded-sm border border-rule">
              <h5 className="font-display font-bold text-base text-paper">{styleOutput.styleName}</h5>
              <p className="text-xs font-body text-paper/80 leading-relaxed italic">"{styleOutput.description}"</p>
            </div>
          ) : (
            <p className="text-xs text-muted italic">No art style defined yet.</p>
          )}
        </div>

        {/* Primary Run Step CTA */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onRunStep(2)}
            className="px-6 py-3.5 bg-oxide hover:bg-oxide-hover text-paper font-bold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
          >
            <UsersRound className="w-4 h-4" />
            <span>Extract Act 02 Adult Characters</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-center space-x-2.5">
          <Users className="w-5 h-5 text-oxide" />
          <h3 className="font-display font-bold text-xl text-paper">Main Story Characters</h3>
        </div>
        <span className="text-xs text-muted font-mono">{characters.length} / Max 2 Adult Characters</span>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-6">
        {characters.map(char => (
          <CharacterCard key={char.id} projectId={project._id} character={char} />
        ))}
      </div>
    </div>
  );
};
