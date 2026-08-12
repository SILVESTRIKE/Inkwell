'use client';

import React from 'react';
import Link from 'next/link';
import { ProjectData } from '@/lib/api-client';
import { Clock, ArrowRight, Check, Lock } from 'lucide-react';
import { isStepUnlocked } from '@/lib/step-utils';

interface BookSpineRowProps {
  project: ProjectData;
  index: number;
}

const STAGES = [
  { num: '01', name: 'STYLE' },
  { num: '02', name: 'CHARACTERS' },
  { num: '03', name: 'PORTRAITS' },
  { num: '04', name: 'CHAPTER' },
  { num: '05', name: 'ILLUSTRATION' },
];

export const BookSpineRow: React.FC<BookSpineRowProps> = ({ project, index }) => {
  const stepStates = project.stepStates || [];
  const completedCount = stepStates.filter(s => s.status === 'done').length;
  const isRunning = stepStates.some(s => s.status === 'running');

  // Determine Lifecycle State
  let lifecycleState: 'DRAFT' | 'IN PROGRESS' | 'DONE' = 'IN PROGRESS';
  let ctaText = 'OPEN STUDIO';
  
  if (completedCount === 5) {
    lifecycleState = 'DONE';
    ctaText = 'VIEW BOOK';
  } else if (completedCount === 0 && !isRunning) {
    lifecycleState = 'DRAFT';
    ctaText = 'CONTINUE SETUP';
  } else {
    lifecycleState = 'IN PROGRESS';
    ctaText = 'OPEN STUDIO';
  }

  // Manuscript Excerpt
  const excerpt = project.bookText
    ? project.bookText.slice(0, 160) + (project.bookText.length > 160 ? '...' : '')
    : 'No manuscript text uploaded yet.';

  const fillPercentage = (completedCount / 5) * 100;

  return (
    <article className="group relative transition-all duration-300">
      <Link
        href={`/projects/${project._id}`}
        className="block bg-charcoal hover:bg-obsidian border border-rule border-l-4 border-l-oxide/60 hover:border-l-oxide rounded-sm p-5 sm:p-7 shadow-card hover:shadow-card-hover transition-all duration-base transform hover:-translate-y-0.5 hover:translate-x-1.5 cursor-pointer"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Top Spine Row: Title, Metadata, State & Ratio */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-rule/60 pb-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-oxide/80 group-hover:bg-oxide shrink-0" />
              <h3 className="font-display font-bold text-xl sm:text-2xl text-paper group-hover:text-oxide transition-colors duration-fast truncate tracking-tight">
                {project.title}
              </h3>
            </div>
            {excerpt && (
              <p className="text-xs font-body text-paper/70 line-clamp-1 italic pl-5 leading-relaxed">
                "{excerpt}"
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
            <span className="flex items-center space-x-1.5 text-muted text-[11px]">
              <Clock className="w-3.5 h-3.5 text-oxide" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </span>

            <span
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs border ${
                lifecycleState === 'DONE'
                  ? 'bg-success/15 text-success border-success/40'
                  : lifecycleState === 'IN PROGRESS'
                  ? 'bg-oxide-soft text-oxide border-oxide/40'
                  : 'bg-obsidian text-muted border-rule'
              }`}
            >
              {lifecycleState}
            </span>
          </div>
        </div>

        {/* Middle Section: 5-Stage Ink Progression Bar */}
        <div className="py-5 space-y-3 font-ui">
          {/* Stage Labels Grid */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
            {STAGES.map((stage, idx) => {
              const stepNum = idx + 1;
              const state = stepStates.find(s => s.stepNumber === stepNum);
              const status = state?.status || 'pending';
              const isCompleted = status === 'done';
              const isUnlocked = isStepUnlocked(stepNum, stepStates);
              const isCurrent = status === 'running' || (stepNum === completedCount + 1 && completedCount < 5 && isUnlocked);

              return (
                <div key={stage.num} className="flex flex-col items-center space-y-1.5">
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-semibold tracking-wider transition-colors ${
                      isCompleted
                        ? 'text-paper font-bold'
                        : isCurrent
                        ? 'text-oxide font-bold'
                        : 'text-faint'
                    }`}
                  >
                    {stage.num} <span className="hidden sm:inline">— {stage.name}</span>
                  </span>

                  {/* Node State Symbol */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-oxide text-paper border border-oxide shadow-xs'
                        : status === 'failed'
                        ? 'bg-charcoal text-error border border-error'
                        : status === 'running'
                        ? 'bg-charcoal text-oxide border border-oxide animate-pulse'
                        : isCurrent
                        ? 'bg-charcoal text-paper border border-paper/60 ring-2 ring-paper/20'
                        : 'bg-obsidian text-faint border border-rule'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : status === 'running' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-oxide animate-ping" />
                    ) : !isUnlocked ? (
                      <Lock className="w-2.5 h-2.5 text-faint stroke-[2]" />
                    ) : (
                      <span>○</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continuous Ink Fill Bar */}
          <div className="relative w-full h-1.5 bg-obsidian border border-rule rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                lifecycleState === 'DONE'
                  ? 'bg-oxide'
                  : isRunning
                  ? 'bg-oxide animate-pulse'
                  : 'bg-oxide/80'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Bottom Spine Footer: Action CTA */}
        <div className="pt-2 flex items-center justify-between font-ui border-t border-rule/40">
          <span className="text-[11px] font-mono text-muted group-hover:text-paper transition-colors truncate max-w-md">
            {lifecycleState === 'DONE'
              ? 'Complete 5-Act storybook manuscript & illustrations'
              : isRunning
              ? 'Gemini pipeline active on server...'
              : `Next Act: 0${Math.min(5, completedCount + 1)} ${STAGES[Math.min(4, completedCount)].name}`}
          </span>

          <div className="flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-oxide group-hover:text-oxide-hover transition-colors shrink-0">
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1.5 transition-transform duration-fast" />
          </div>
        </div>
      </Link>
    </article>
  );
};
