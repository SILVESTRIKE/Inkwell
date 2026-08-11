'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Sparkles } from 'lucide-react';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [error, setError] = useState('');
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
      const project = await api.createProject(title.trim(), bookText.trim());
      router.push(`/projects/${project._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
      setSubmitting(false);
    }
  };

  if (!user) return <AuthModal />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
        <Link
          href="/projects"
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Create New Storybook Project <Sparkles className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400">
            Paste or upload text from a book to begin the 5-step illustration pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Project Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. The Wind in the Willows"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Upload .txt File (Optional)
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 hover:border-slate-700 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-slate-500" />
                <p className="mb-1 text-sm text-slate-400">
                  <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">PLAIN TEXT (.txt)</p>
              </div>
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Book Content *
            </label>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {bookText.length} characters
            </span>
          </div>
          <textarea
            value={bookText}
            onChange={e => setBookText(e.target.value)}
            rows={10}
            placeholder="Paste your book chapter or story excerpt here..."
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono text-sm leading-relaxed"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <Link
            href="/projects"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Creating Project...' : 'Initialize Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
