'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ProjectData } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, BookOpen, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

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
      <div className="flex items-center justify-center py-20 text-slate-500">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            My Book Projects <Sparkles className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Transform book text into character portraits and chapter illustrations.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
          <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-500 mx-auto mb-4 border border-slate-700">
            <BookOpen className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Projects Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            Upload or paste a book text to start generating AI storybook illustrations step-by-step.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-md transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Project</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const completedCount = (project.stepStates || []).filter(s => s.status === 'done').length;
            const statusColor =
              project.overallStatus === 'done'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : project.overallStatus === 'in_progress'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition line-clamp-1">
                      {project.title}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize shrink-0 ${statusColor}`}
                    >
                      {project.overallStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {project.bookText}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-slate-300">
                      {completedCount} / 5 Steps Done
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(completedCount / 5) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Open Pipeline</span>
                    <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" />
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
