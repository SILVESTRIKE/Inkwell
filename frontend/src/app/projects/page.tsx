'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ProjectData } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, BookOpen, Clock, ArrowRight } from 'lucide-react';

import { BookSpineRow } from '@/components/catalog/BookSpineRow';

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
    <div className="space-y-10 font-ui max-w-6xl mx-auto w-full px-4 py-8 sm:px-8 sm:py-12">
      {/* Editorial Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-rule pb-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="label-sm">Archival Library</span>
            <span className="text-[11px] font-mono text-muted border-l border-rule pl-2.5">
              {projects.length} {projects.length === 1 ? 'Volume' : 'Volumes'} In Archive
            </span>
          </div>
          <h2 className="text-4xl font-display font-bold text-paper tracking-tight">
            Storybook Catalog
          </h2>
          <p className="text-sm font-body text-muted max-w-xl leading-relaxed">
            Stories waiting to become worlds. Each horizontal volume tracks the five-act progression from plain text manuscript to rendered scene artwork.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Volume</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-error-bg border border-error/20 rounded-xs text-error text-xs font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-charcoal rounded-sm border border-rule animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-charcoal border border-rule border-l-4 border-l-oxide/60 rounded-sm p-8 shadow-card my-6">
          <div className="w-12 h-12 bg-obsidian rounded-xs flex items-center justify-center text-oxide mx-auto mb-4 border border-rule">
            <BookOpen className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-2xl font-display font-bold text-paper mb-2">Your Catalog Is Empty</h3>
          <p className="text-sm font-body text-muted max-w-md mx-auto mb-6 leading-relaxed">
            Begin by adding your first book manuscript. The studio will guide your story through style derivation, character extraction, portrait generation, chapter analysis, and scene illustration.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Volume</span>
          </Link>
        </div>
      ) : (
        /* Horizontal Book Spine Vertical Archive Stack */
        <div className="space-y-4 sm:space-y-5">
          {projects.map((project, index) => (
            <BookSpineRow
              key={project._id}
              project={project}
              index={index}
              onDelete={(deletedId) => setProjects(prev => prev.filter(p => p._id !== deletedId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
