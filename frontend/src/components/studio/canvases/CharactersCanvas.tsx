'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { Users, UsersRound, Sparkles } from 'lucide-react';
import { CharacterCard } from '@/components/cards/CharacterCard';

interface CharactersCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const CharactersCanvas: React.FC<CharactersCanvasProps> = ({ project, onRunStep }) => {
  const characters = project.outputs?.characters || [];

  if (characters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <UsersRound className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Discover Story Cast</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 02 extracts up to 2 adult main characters from your manuscript and formulates tailored image prompts.
          </p>
        </div>
        <button
          onClick={() => onRunStep(2)}
          className="px-6 py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Discover Characters</span>
        </button>
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
