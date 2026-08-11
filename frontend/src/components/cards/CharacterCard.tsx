import React from 'react';
import { CharacterOutput, api } from '@/lib/api-client';
import { User, Image as ImageIcon } from 'lucide-react';

interface CharacterCardProps {
  projectId: string;
  character: CharacterOutput;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ projectId, character }) => {
  const rawTarget = character.portraitFilename || (character as any).portraitUrl;
  const mediaUrl = rawTarget ? api.getMediaUrl(projectId, rawTarget) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-44 h-44 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700 shrink-0">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="w-8 h-8 mb-2 stroke-1" />
            <span className="text-xs">Portrait Pending</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h4 className="text-lg font-semibold text-white">{character.name}</h4>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              Adult Character
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{character.description}</p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
          <span className="text-indigo-400 font-sans text-xs font-semibold block mb-1">Image Prompt:</span>
          {character.imagePrompt}
        </div>
      </div>
    </div>
  );
};
