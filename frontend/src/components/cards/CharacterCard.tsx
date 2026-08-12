import React, { useState } from 'react';
import { CharacterOutput, api } from '@/lib/api-client';
import { Image as ImageIcon } from 'lucide-react';

interface CharacterCardProps {
  projectId: string;
  character: CharacterOutput;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ projectId, character }) => {
  const [imageError, setImageError] = useState(false);
  const rawTarget = character.portraitFilename || (character as any).portraitUrl;
  const mediaUrl = rawTarget ? api.getMediaUrl(projectId, rawTarget) : null;

  return (
    <div className="bg-charcoal border border-rule rounded-md p-6 shadow-card hover:shadow-card-hover transition duration-base flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-44 h-44 bg-obsidian rounded-xs overflow-hidden flex items-center justify-center border border-rule shrink-0">
        {mediaUrl && !imageError ? (
          <img
            src={mediaUrl}
            alt={character.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted font-ui">
            <ImageIcon className="w-5 h-5 mb-1.5 stroke-1 text-faint" />
            <span className="text-[11px] uppercase tracking-wider font-medium">
              {imageError ? 'Load Failed' : 'Portrait Pending'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline space-x-3 mb-2">
            <h4 className="text-xl font-display font-bold text-paper">{character.name}</h4>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted font-ui font-semibold">
              Main Character
            </span>
          </div>
          <p className="text-sm font-body text-paper/90 leading-relaxed">{character.description}</p>
        </div>

        <div className="pt-3 border-t border-rule mt-4 text-xs">
          <span className="label-sm block mb-1.5">Image Prompt</span>
          <div className="bg-sunken p-3 rounded-xs border border-rule">
            <span className="text-muted leading-relaxed font-mono text-[11px] block">{character.imagePrompt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
