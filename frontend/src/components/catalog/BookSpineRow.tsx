'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, ProjectData } from '@/lib/api-client';
import { Clock, ArrowRight, Lock, Check, Trash2, AlertCircle } from 'lucide-react';
import { isStepUnlocked } from '@/lib/step-utils';

interface BookSpineRowProps {
  project: ProjectData;
  index: number;
  onDelete?: (projectId: string) => void;
}

const STAGES = [
  { num: '01', name: 'Style' },
  { num: '02', name: 'Characters' },
  { num: '03', name: 'Portraits' },
  { num: '04', name: 'Chapter' },
  { num: '05', name: 'Illustration' },
];

export const BookSpineRow: React.FC<BookSpineRowProps> = ({ project, index, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stepStates = project.stepStates || [];
  const completedCount = stepStates.filter(s => s.status === 'done').length;
  const isRunning = stepStates.some(s => s.status === 'running');

  const failedStepState = stepStates.find(s => s.status === 'failed');
  const failedStepNum = failedStepState?.stepNumber;

  // Determine Lifecycle State (DONE | FAILED | DRAFT | IN PROGRESS)
  let lifecycleState: 'DRAFT' | 'IN PROGRESS' | 'DONE' | 'FAILED' = 'IN PROGRESS';
  let badgeText = 'IN PROGRESS';
  let ctaText = 'OPEN STUDIO';
  
  if (completedCount === 5) {
    lifecycleState = 'DONE';
    badgeText = 'DONE';
    ctaText = 'VIEW BOOK';
  } else if (failedStepState) {
    lifecycleState = 'FAILED';
    badgeText = `FAILED (ACT 0${failedStepNum})`;
    ctaText = `RETRY ACT 0${failedStepNum}`;
  } else if (completedCount === 0 && !isRunning) {
    lifecycleState = 'DRAFT';
    badgeText = 'DRAFT';
    ctaText = 'CONTINUE SETUP';
  } else {
    lifecycleState = 'IN PROGRESS';
    badgeText = 'IN PROGRESS';
    ctaText = 'OPEN STUDIO';
  }

  // Handle Delete Action
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setDeleting(true);
      await api.deleteProject(project._id);
      onDelete?.(project._id);
    } catch (err) {
      console.error('Failed to delete project:', err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  };

  // Manuscript Excerpt / Subtitle Text
  const styleName = project.outputs?.style?.styleName || project.outputs?.style?.userStyle;
  const characterCount = project.outputs?.characters?.length || 0;

  let subtitleText = '';
  if (project.bookText) {
    subtitleText = project.bookText.slice(0, 140) + (project.bookText.length > 140 ? '...' : '');
  } else if (styleName && characterCount > 0) {
    subtitleText = `Style: ${styleName} • ${characterCount} ${characterCount === 1 ? 'Character' : 'Characters'}`;
  } else if (styleName) {
    subtitleText = `Style: ${styleName}`;
  } else {
    subtitleText = 'No manuscript text uploaded yet.';
  }

  const fillPercentage = (completedCount / 5) * 100;

  return (
    <article className="group relative transition-all duration-base">
      <Link
        href={`/projects/${project._id}`}
        className="relative block bg-charcoal hover:bg-obsidian border border-rule hover:border-rule-strong rounded-md shadow-card hover:shadow-card-hover transition-all duration-base transform hover:-translate-y-0.5 cursor-pointer overflow-hidden p-4 sm:px-6 sm:py-4.5 space-y-2"
        onMouseLeave={() => setConfirmDelete(false)}
      >
        {/* Elegant Translucent Ink Fill Background Overlay */}
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out z-0 ${
            lifecycleState === 'DONE'
              ? 'border-r-2 border-success/60'
              : lifecycleState === 'FAILED'
              ? 'border-r-2 border-error/60'
              : isRunning
              ? 'border-r-2 border-oxide animate-pulse'
              : fillPercentage > 0
              ? 'border-r-2 border-oxide/60'
              : 'border-none'
          }`}
          style={{
            width: `${fillPercentage}%`,
            backgroundColor:
              lifecycleState === 'DONE'
                ? 'rgba(110, 155, 123, 0.25)'
                : lifecycleState === 'FAILED'
                ? 'rgba(217, 83, 79, 0.20)'
                : isRunning
                ? 'rgba(182, 83, 53, 0.30)'
                : fillPercentage > 0
                ? 'rgba(182, 83, 53, 0.22)'
                : 'transparent',
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10 space-y-2">
          
          {/* 1. Header: Title + Clock Date, Lifecycle Badge & Trash Delete Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-paper group-hover:text-oxide transition-colors duration-fast truncate tracking-tight">
                {project.title}
              </h3>
            </div>

            <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
              <span className="text-muted text-[11px] flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-oxide" />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </span>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border ${
                  lifecycleState === 'DONE'
                    ? 'bg-success/15 text-success border-success/40'
                    : lifecycleState === 'FAILED'
                    ? 'bg-error/20 text-error border-error/50'
                    : lifecycleState === 'IN PROGRESS'
                    ? 'bg-oxide-soft text-oxide border-oxide/40'
                    : 'bg-rule/30 text-muted border-rule'
                }`}
              >
                {badgeText}
              </span>

              {/* Trash Delete Button: Appears on hover */}
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {confirmDelete ? (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-2 py-0.5 text-[10px] font-bold uppercase bg-error/20 text-error hover:bg-error/30 border border-error/40 rounded-xs transition-colors cursor-pointer"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="px-1.5 py-0.5 text-[10px] text-muted hover:text-paper cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDelete}
                    title="Delete project volume"
                    className="p-1 text-muted hover:text-error transition-colors rounded-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Subtitle Excerpt */}
          <p className="text-xs font-body text-paper/70 line-clamp-1 italic leading-relaxed">
            {subtitleText}
          </p>

          {/* 3. Collapsible Hover Reveal Container (Stage Track & CTA Button) */}
          <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-32 group-hover:opacity-100 transition-all duration-300 ease-out space-y-3 pt-0 group-hover:pt-3 group-hover:border-t group-hover:border-rule/40">
            {/* Fixed 5-Column Stage Track */}
            <div className="grid grid-cols-5 gap-2 font-ui text-xs text-center sm:text-left">
              {STAGES.map((stage, idx) => {
                const stepNum = idx + 1;
                const state = stepStates.find(s => s.stepNumber === stepNum);
                const status = state?.status || 'pending';
                const isCompleted = status === 'done';
                const isFailedStep = status === 'failed';
                const isUnlocked = isStepUnlocked(stepNum, stepStates);
                const isCurrent = status === 'running' || (stepNum === completedCount + 1 && completedCount < 5 && isUnlocked);
                const stageDisplayName = (stepNum === 5 && completedCount === 5) ? 'Done' : stage.name;

                return (
                  <div key={stage.num} className="flex flex-col items-center sm:items-start space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5 truncate">
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-oxide stroke-[2.5] shrink-0" />
                      ) : isFailedStep ? (
                        <AlertCircle className="w-3.5 h-3.5 text-error stroke-[2] shrink-0" />
                      ) : status === 'running' ? (
                        <span className="w-2 h-2 rounded-full bg-oxide animate-pulse shrink-0 inline-block" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-paper/80 shrink-0 inline-block" />
                      ) : !isUnlocked ? (
                        <Lock className="w-3 h-3 text-faint stroke-[1.5] shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-rule-strong shrink-0 inline-block" />
                      )}

                      <span
                        className={`text-xs font-medium truncate ${
                          isCompleted
                            ? 'text-paper font-semibold'
                            : isFailedStep
                            ? 'text-error font-bold'
                            : isCurrent
                            ? 'text-oxide font-bold'
                            : 'text-muted/70 group-hover:text-muted'
                        }`}
                      >
                        {stageDisplayName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-end font-ui pt-0.5">
              <div className={`flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-fast ${
                lifecycleState === 'FAILED' ? 'text-error group-hover:text-error' : 'text-oxide/80 group-hover:text-oxide'
              }`}>
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-fast" />
              </div>
            </div>
          </div>

        </div>
      </Link>
    </article>
  );
};


