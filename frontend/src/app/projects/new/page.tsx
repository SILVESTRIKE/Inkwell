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
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 space-y-8 font-ui">
      {/* Page Header */}
      <div className="flex items-start justify-between border-b border-rule pb-6">
        <div className="flex items-center space-x-3">
          <Link
            href="/projects"
            className="p-2 bg-charcoal hover:bg-obsidian text-muted hover:text-paper rounded-sm border border-rule transition duration-fast"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="label-sm block mb-1">New Manuscript</span>
            <h2 className="text-3xl font-display font-bold text-paper tracking-tight">
              Import Storybook Text
            </h2>
            <p className="text-xs font-body text-muted mt-1 leading-relaxed">
              Upload a plain text manuscript or paste your story excerpt to initiate the 5-act pipeline.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-bg border border-error/30 rounded-sm text-error text-xs font-medium flex items-center space-x-2">
          <FileText className="w-4 h-4 text-error shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Creation Card */}
      <form onSubmit={handleSubmit} className="bg-charcoal border border-rule rounded-md p-6 sm:p-8 shadow-card space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Title & Upload Dropzone */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <label className="block label-sm mb-2 text-paper">
                Project Title <span className="text-oxide">*</span>
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
              <label className="block label-sm mb-2 text-paper">
                Upload Manuscript File (.txt)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border border-rule border-dashed rounded-sm cursor-pointer bg-obsidian hover:bg-sunken transition duration-fast p-4 text-center group">
                  <Upload className="w-6 h-6 mb-2 text-muted group-hover:text-oxide transition duration-fast" />
                  <p className="text-xs text-muted leading-relaxed">
                    <span className="font-semibold text-oxide">Click to browse</span> or drag plain text manuscript file (<span className="font-mono text-faint">.txt</span>)
                  </p>
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Manuscript Text Editor */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block label-sm text-paper">
                Manuscript Text Content <span className="text-oxide">*</span>
              </label>
              <span className="text-xs text-faint font-mono flex items-center gap-1.5 bg-obsidian px-2 py-0.5 rounded-xs border border-rule">
                <FileText className="w-3.5 h-3.5 text-oxide" />
                {bookText.length} characters
              </span>
            </div>
            <textarea
              value={bookText}
              onChange={e => setBookText(e.target.value)}
              rows={12}
              placeholder="Paste your story excerpt or book chapter text here..."
              className="w-full p-4 bg-obsidian border border-rule-strong rounded-sm text-paper placeholder-faint focus:outline-none focus:border-oxide transition duration-fast font-body text-xs sm:text-sm leading-relaxed"
              required
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-rule">
          <Link
            href="/projects"
            className="px-5 py-2.5 bg-obsidian hover:bg-sunken text-muted hover:text-paper border border-rule rounded-sm text-xs font-semibold uppercase tracking-wider transition duration-fast"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-bold uppercase tracking-wider rounded-sm shadow-card transition duration-fast disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Initializing Pipeline...' : 'Initialize Project'}
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
