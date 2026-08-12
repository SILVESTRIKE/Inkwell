'use client';

import React from 'react';
import { ProjectData, api } from '@/lib/api-client';
import { BookOpen, ScrollText } from 'lucide-react';
import { ChapterCard } from '@/components/cards/ChapterCard';

interface ChapterCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const ChapterCanvas: React.FC<ChapterCanvasProps> = ({ project, onRunStep }) => {
  const chapters = project.outputs?.chapters || [];
  const characters = project.outputs?.characters || [];

  if (chapters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto animate-in fade-in-50 duration-300">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <BookOpen className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Analyze Chapter Scenes</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 04 formulates key chapter scene illustration prompts and narrative summaries.
          </p>
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
