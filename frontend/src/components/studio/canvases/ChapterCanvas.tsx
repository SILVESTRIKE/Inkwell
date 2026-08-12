'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { BookOpen, Sparkles, ScrollText } from 'lucide-react';
import { ChapterCard } from '@/components/cards/ChapterCard';

interface ChapterCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const ChapterCanvas: React.FC<ChapterCanvasProps> = ({ project, onRunStep }) => {
  const chapters = project.outputs?.chapters || [];

  if (chapters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <BookOpen className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Analyze Chapter Scenes</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 04 formulates key chapter scene illustration prompts and narrative summaries.
          </p>
        </div>
        <button
          onClick={() => onRunStep(4)}
          className="px-6 py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze Chapter Scenes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-center space-x-2.5">
          <ScrollText className="w-5 h-5 text-oxide" />
          <h3 className="font-display font-bold text-xl text-paper">Chapter Scene Analysis</h3>
        </div>
        <span className="text-xs text-muted font-mono">{chapters.length} / Max 1 Chapter Scene</span>
      </div>

      {/* Chapter Cards List */}
      <div className="grid grid-cols-1 gap-6">
        {chapters.map(ch => (
          <ChapterCard key={ch.id} projectId={project._id} chapter={ch} />
        ))}
      </div>
    </div>
  );
};
