'use client';

import React from 'react';
import { ProjectData } from '@/lib/api-client';
import { Palette, Feather } from 'lucide-react';

interface StyleCanvasProps {
  project: ProjectData;
  onRunStep: (stepNum: number) => Promise<void>;
}

export const StyleCanvas: React.FC<StyleCanvasProps> = ({ project, onRunStep }) => {
  const style = project.outputs?.style;

  if (!style?.styleName) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center font-ui space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide">
          <Palette className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-paper">Define Visual Language</h3>
          <p className="text-sm font-body text-muted mt-2 leading-relaxed">
            Act 01 analyzes your manuscript's genre and narrative tone to derive an aesthetic storybook art direction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui max-w-3xl mx-auto p-4 sm:p-6">
      {/* Editorial Style Card */}
      <div className="bg-charcoal border border-rule rounded-md p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-5 h-5 text-oxide" />
            <span className="label-sm">Act 01 — Aesthetic Art Direction</span>
          </div>
          <span className="text-xs text-muted font-mono">Defined</span>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-3xl text-paper tracking-tight">
            {style.styleName}
          </h2>
          <p className="text-base font-body text-paper/90 leading-relaxed max-w-2xl border-l-2 border-oxide pl-4 py-1 italic">
            "{style.description}"
          </p>
        </div>

        {style.userStyle && (
          <div className="pt-4 border-t border-rule space-y-1.5">
            <span className="label-sm text-[10px]">Custom User Direction Supplied</span>
            <div className="p-3 bg-obsidian border border-rule rounded-sm text-xs font-mono text-paper">
              {style.userStyle}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-rule flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5 font-body italic">
            <Feather className="w-3.5 h-3.5 text-oxide" /> Applied to character portraits and scene artwork
          </span>
        </div>
      </div>
    </div>
  );
};
