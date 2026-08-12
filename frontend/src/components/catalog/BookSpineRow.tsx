'use client';

import React from 'react';
import Link from 'next/link';
import { ProjectData } from '@/lib/api-client';
import { Clock, ArrowRight, Lock } from 'lucide-react';
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
        className="block relative bg-charcoal hover:bg-obsidian border border-rule border-l-4 border-l-oxide/70 hover:border-l-oxide rounded-sm p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all duration-base transform hover:-translate-y-0.5 hover:translate-x-1.5 cursor-pointer overflow-hidden"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Background Ink Fill Bar across the ENTIRE Book Spine */}
        <div
          className="absolute bottom-0 left-0 top-0 bg-gradient-to-r from-oxide/30 via-oxide/25 to-oxide/35 group-hover:from-oxide/35 group-hover:to-oxide/40 border-r-2 border-oxide shadow-[inset_0_0_24px_rgba(217,107,74,0.2)] transition-all duration-700 pointer-events-none"
          style={{ width: `${fillPercentage}%` }}
        />

        {/* Book Spine Contents */}
        <div className="relative z-10 space-y-5">
          {/* 1. Spine Header: Title, Quote & Lifecycle Status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-paper group-hover:text-oxide transition-colors duration-fast truncate tracking-tight">
                {project.title}
              </h3>
              {excerpt && (
                <p className="text-xs font-body text-paper/70 line-clamp-1 italic leading-relaxed">
                  "{excerpt}"
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
              <span className="text-muted text-[11px] flex items-center space-x-1.5">
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

          {/* 2. 5-Act Progression: Minimal Symbols + Hover Reveal Labels */}
          <div className="grid grid-cols-5 gap-2 text-center items-end pt-2 font-ui">
            {STAGES.map((stage, idx) => {
              const stepNum = idx + 1;
              const state = stepStates.find(s => s.stepNumber === stepNum);
              const status = state?.status || 'pending';
              const isCompleted = status === 'done';
              const isUnlocked = isStepUnlocked(stepNum, stepStates);
              const isCurrent = status === 'running' || (stepNum === completedCount + 1 && completedCount < 5 && isUnlocked);

              return (
                <div key={stage.num} className="flex flex-col items-center space-y-1.5">
                  {/* Step Label: Hidden by default, reveals on hover */}
                  <span
                    className={`text-[10px] font-mono font-semibold tracking-wider transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                      isCompleted
                        ? 'text-paper font-bold'
                        : isCurrent
                        ? 'text-oxide font-bold'
                        : 'text-faint'
                    }`}
                  >
                    {stage.num} <span className="hidden sm:inline">— {stage.name}</span>
                  </span>

                  {/* Minimal Stage Symbol (✓, ●, o, 🔒) */}
                  <div className="h-5 flex items-center justify-center font-mono text-xs">
                    {isCompleted ? (
                      <span className="text-oxide font-bold text-base">✓</span>
                    ) : status === 'running' ? (
                      <span className="w-2 h-2 rounded-full bg-oxide animate-ping inline-block" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-paper inline-block" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3 h-3 text-faint stroke-[1.5]" />
                    ) : (
                      <span className="text-faint text-xs">o</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Footer CTA: Hidden by default, reveals on hover */}
          <div className="flex items-center justify-end h-5 pt-1 font-ui">
            <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-oxide transition-all duration-300 opacity-0 group-hover:opacity-100">
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-fast" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
