'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText } from 'lucide-react';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [error, setError] = useState('');
  const [duplicateProject, setDuplicateProject] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please upload a valid .txt file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setBookText(text || '');
      setError('');
    };
    reader.readAsText(file);
  };

  const executeCreate = async () => {
    try {
      setSubmitting(true);
      setError('');
      const project = await api.createProject(title.trim(), bookText.trim());
      router.push(`/projects/${project._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!bookText.trim()) {
      setError('Book text content is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // Check if raw book text matches an existing project
      const checkRes = await api.checkBook(bookText.trim());
      if (checkRes.exists && checkRes.project) {
        setDuplicateProject(checkRes.project);
        setSubmitting(false);
        return;
      }
      await executeCreate();
    } catch (err: any) {
      setError(err.message || 'Failed to check book manuscript.');
      setSubmitting(false);
    }
  };

  if (!user) return <AuthModal />;

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-ui">
      <div className="flex items-center space-x-3 border-b border-rule pb-6">
        <Link
          href="/projects"
          className="p-1.5 bg-charcoal hover:bg-obsidian text-muted hover:text-paper rounded-sm border border-rule transition duration-fast"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="label-sm block mb-0.5">New Project</span>
          <h2 className="text-2xl font-display font-bold text-paper">
            Import Storybook Text
          </h2>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-bg border border-error/20 rounded-xs text-error text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-charcoal border border-rule rounded-md p-6 sm:p-8 shadow-card space-y-6">
        <div>
          <label className="block label-sm mb-2">
            Project Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. The Wind in the Willows"
            className="w-full px-4 py-2.5 bg-obsidian border border-rule-strong rounded-sm text-paper text-sm placeholder-faint focus:outline-none focus:border-oxide transition duration-fast"
            required
          />
        </div>

        <div>
          <label className="block label-sm mb-2">
            Upload Plain Text File (.txt)
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border border-rule border-dashed rounded-sm cursor-pointer bg-obsidian hover:bg-charcoal transition duration-fast">
              <div className="flex flex-col items-center justify-center py-3">
                <Upload className="w-5 h-5 mb-1 text-faint" />
                <p className="text-xs text-muted">
                  <span className="font-semibold text-oxide">Click to select</span> or drag plain text manuscript (.txt)
                </p>
              </div>
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block label-sm">
              Manuscript Text Content *
            </label>
            <span className="text-xs text-faint font-mono flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {bookText.length} characters
            </span>
          </div>
          <textarea
            value={bookText}
            onChange={e => setBookText(e.target.value)}
            rows={10}
            placeholder="Paste your story excerpt or book chapter here..."
            className="w-full p-4 bg-obsidian border border-rule-strong rounded-sm text-paper placeholder-faint focus:outline-none focus:border-oxide transition duration-fast font-body text-sm leading-relaxed book-measure"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-rule">
          <Link
            href="/projects"
            className="px-4 py-2 bg-obsidian hover:bg-charcoal text-muted hover:text-paper border border-rule rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition duration-fast disabled:opacity-50"
          >
            {submitting ? 'Initializing...' : 'Initialize Project'}
          </button>
        </div>
      </form>

      {/* Duplicate Manuscript Detected Modal */}
      {duplicateProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-charcoal border border-rule rounded-md p-6 max-w-md w-full space-y-4 shadow-card font-ui">
            <div className="flex items-center space-x-3 text-oxide">
              <FileText className="w-6 h-6" />
              <h3 className="text-lg font-display font-bold text-paper">Existing Book Content Detected</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              This exact raw manuscript text already exists in your project catalog under title:
            </p>
            <div className="p-3 bg-obsidian border border-rule rounded-sm text-xs text-paper font-semibold">
              {duplicateProject.title}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              You can open the existing project to view/retry pipeline steps, or create a brand new duplicate project.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => executeCreate()}
                className="px-3.5 py-2 bg-obsidian hover:bg-charcoal text-muted hover:text-paper border border-rule rounded-sm text-xs font-medium transition duration-fast"
              >
                Create New Duplicate
              </button>
              <button
                type="button"
                onClick={() => router.push(`/projects/${duplicateProject._id}`)}
                className="px-4 py-2 bg-oxide hover:bg-oxide-hover text-paper rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast"
              >
                Open Existing Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
