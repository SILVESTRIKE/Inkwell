'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ProjectData } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted text-xs font-ui tracking-wider uppercase">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="space-y-8 font-ui max-w-5xl mx-auto w-full px-4 py-8 sm:px-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <span className="label-sm block mb-1">Catalog</span>
          <h2 className="text-3xl font-display font-bold text-paper tracking-tight">
            Book Projects
          </h2>
          <p className="text-sm font-body text-muted mt-1.5 max-w-lg leading-relaxed">
            Storybook illustration pipelines generated from plain book manuscripts.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-error-bg border border-error/20 rounded-xs text-error text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-charcoal rounded-md border border-rule animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-charcoal border border-rule rounded-md p-8 shadow-card my-8">
          <div className="w-10 h-10 bg-obsidian rounded-xs flex items-center justify-center text-muted mx-auto mb-4 border border-rule">
            <BookOpen className="w-5 h-5 stroke-1" />
          </div>
          <h3 className="text-xl font-display font-bold text-paper mb-2">No Projects Found</h3>
          <p className="text-sm font-body text-muted max-w-sm mx-auto mb-6 leading-relaxed">
            Upload or paste a book manuscript to initiate the five-act illustration pipeline.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Project</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => {
            const stepStates = project.stepStates || [];
            const completedCount = stepStates.filter(s => s.status === 'done').length;
            const overallStatus = project.overallStatus || 'draft';

            const ACT_SHORT_NAMES = [
              { num: 1, label: 'Style' },
              { num: 2, label: 'Cast' },
              { num: 3, label: 'Portraits' },
              { num: 4, label: 'Scenes' },
              { num: 5, label: 'Artwork' },
            ];

            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="bg-charcoal border border-rule border-l-4 border-l-oxide hover:border-rule-strong rounded-md p-6 transition duration-base shadow-card hover:shadow-card-hover flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Book Header & Status Badge */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 bg-obsidian border border-rule rounded-xs flex items-center justify-center text-oxide shrink-0">
                        <BookOpen className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-paper group-hover:text-oxide transition duration-fast truncate">
                        {project.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs shrink-0 border ${
                        overallStatus === 'done'
                          ? 'bg-success/15 text-success border-success/40'
                          : overallStatus === 'in_progress'
                          ? 'bg-oxide-soft text-oxide border-oxide/40'
                          : 'bg-obsidian text-muted border-rule'
                      }`}
                    >
                      {overallStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Manuscript Prose Preview */}
                  <p className="text-xs font-body text-paper/80 line-clamp-2 leading-relaxed italic border-l-2 border-rule pl-3 py-0.5">
                    "{project.bookText}"
                  </p>
                </div>

                {/* Visual 5-Act Connected Pipeline Track */}
                <div className="space-y-4 pt-5 mt-4 border-t border-rule/60">
                  <div className="flex items-center justify-between text-[11px] font-ui">
                    <span className="text-muted font-mono uppercase tracking-wider">Pipeline Progress</span>
                    <span className="font-bold text-paper font-mono">
                      {completedCount} / 5 Acts Done
                    </span>
                  </div>

                  {/* Connected Stepper Line & Nodes */}
                  <div className="relative flex items-center justify-between px-1 py-1">
                    {/* Background Line */}
                    <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-obsidian border-t border-rule -translate-y-1/2 rounded-full" />

                    {/* Progress Fill Line */}
                    <div
                      className="absolute top-3.5 left-4 h-0.5 bg-oxide -translate-y-1/2 transition-all duration-500 rounded-full"
                      style={{ width: `${((Math.max(1, completedCount) - 1) / 4) * 88}%` }}
                    />

                    {ACT_SHORT_NAMES.map(act => {
                      const state = stepStates.find(s => s.stepNumber === act.num);
                      const status = state?.status || 'pending';

                      return (
                        <div key={act.num} className="relative z-10 flex flex-col items-center group/node">
                          <div
                            className={`w-7 h-7 rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-300 ${
                              status === 'done'
                                ? 'bg-oxide text-paper border-2 border-oxide shadow-card'
                                : status === 'failed'
                                ? 'bg-error-bg text-error border-2 border-error'
                                : status === 'running'
                                ? 'bg-oxide-soft text-oxide border-2 border-oxide animate-pulse'
                                : 'bg-obsidian text-muted border-2 border-rule'
                            }`}
                          >
                            {status === 'done' ? (
                              <span className="text-paper text-[11px] font-bold">✓</span>
                            ) : (
                              <span>0{act.num}</span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-muted mt-1.5 transition-colors group-hover/node:text-paper">
                            {act.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Bottom Meta & CTA */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="flex items-center gap-1.5 text-faint text-[11px] font-mono">
                      <Clock className="w-3 h-3 text-oxide shrink-0" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center text-xs font-bold uppercase tracking-wider text-oxide group-hover:text-oxide-hover">
                      <span>Open Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition duration-fast" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
