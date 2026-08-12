'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, ProjectData } from '@/lib/api-client';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

import { WorkflowSidebar } from '@/components/studio/WorkflowSidebar';
import { ControlPanel } from '@/components/studio/ControlPanel';
import { BottomNav } from '@/components/studio/BottomNav';
import { BookTextDrawer } from '@/components/studio/BookTextDrawer';

import { StyleCanvas } from '@/components/studio/canvases/StyleCanvas';
import { CharactersCanvas } from '@/components/studio/canvases/CharactersCanvas';
import { PortraitsCanvas } from '@/components/studio/canvases/PortraitsCanvas';
import { ChapterCanvas } from '@/components/studio/canvases/ChapterCanvas';
import { IllustrationCanvas } from '@/components/studio/canvases/IllustrationCanvas';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [userStyle, setUserStyle] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setError('');
      const data = await api.getProject(projectId);
      setProject(data);

      const running = data.stepStates?.find(s => s.status === 'running');
      if (running) {
        setRunningStep(running.stepNumber);
      } else {
        setRunningStep(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId, fetchProject]);

  // Set default active step to first non-completed or running step
  useEffect(() => {
    if (project?.stepStates) {
      const running = project.stepStates.find(s => s.status === 'running');
      if (running) {
        setActiveStep(running.stepNumber);
        return;
      }
      const firstPending = project.stepStates.find(s => s.status === 'pending');
      if (firstPending) {
        setActiveStep(firstPending.stepNumber);
      } else {
        setActiveStep(5); // Default to final act if all done
      }
    }
  }, [project?._id]);

  // Polling hook every 3s if step is running
  useEffect(() => {
    if (!runningStep) return;
    const interval = setInterval(() => {
      fetchProject();
    }, 3000);
    return () => clearInterval(interval);
  }, [runningStep, fetchProject]);

  const handleRunStep = async (stepNumber: number) => {
    try {
      setRunningStep(stepNumber);
      setError('');
      const updated = await api.runStep(projectId, stepNumber, userStyle);
      setProject(updated);
    } catch (err: any) {
      setError(err.message || `Step ${stepNumber} execution failed`);
      setRunningStep(null);
      await fetchProject();
    }
  };

  const handleRecoverStuckStep = async (stepNumber: number) => {
    try {
      setRecovering(true);
      setError('');
      const updated = await api.recoverStep(projectId, stepNumber);
      setProject(updated);
      setRunningStep(null);
    } catch (err: any) {
      setError(err.message || 'Failed to recover step');
    } finally {
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3 font-ui text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-oxide" />
        <p className="text-xs uppercase tracking-wider font-semibold">Opening Studio Workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-error-bg border border-error/30 rounded-md p-6 text-center space-y-3 font-ui max-w-lg mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-error mx-auto" />
        <h3 className="text-sm font-semibold text-error">Project Not Found or Access Denied</h3>
        <p className="text-xs text-muted">{error || 'Could not fetch project details.'}</p>
        <Link
          href="/projects"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-charcoal text-paper border border-rule rounded-sm text-xs font-medium hover:bg-obsidian transition duration-fast"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden bg-obsidian text-paper font-ui">
      {/* Top Studio Header (Height-Locked: 52px) */}
      <header className="h-13 bg-charcoal border-b border-rule px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-3">
          <Link
            href="/projects"
            className="p-1 text-muted hover:text-paper bg-obsidian hover:bg-sunken rounded-sm border border-rule transition duration-fast"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="font-display font-bold text-lg text-paper truncate max-w-xs sm:max-w-md">
              {project.title}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-oxide-soft text-oxide border border-oxide/40">
              {(project.overallStatus || 'draft').replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="hidden md:flex items-center space-x-1 text-faint text-[11px]">
            <Clock className="w-3 h-3 text-oxide" />
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </span>

          <button
            onClick={() => setIsBookDrawerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-obsidian hover:bg-charcoal text-paper border border-rule rounded-sm text-xs font-medium transition duration-fast cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-oxide" />
            <span>Read Manuscript</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Workspace Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Workflow Navigator (~20-22% width, Collapsible) */}
        <WorkflowSidebar
          project={project}
          selectedStep={activeStep}
          onSelectStep={stepNum => setActiveStep(stepNum)}
          onOpenBookDrawer={() => setIsBookDrawerOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Creative Canvas (~58% width, Local Scroll Container) */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-obsidian relative">
          {activeStep === 1 && <StyleCanvas project={project} onRunStep={handleRunStep} />}
          {activeStep === 2 && <CharactersCanvas project={project} onRunStep={handleRunStep} />}
          {activeStep === 3 && <PortraitsCanvas project={project} onRunStep={handleRunStep} />}
          {activeStep === 4 && <ChapterCanvas project={project} onRunStep={handleRunStep} />}
          {activeStep === 5 && <IllustrationCanvas project={project} onRunStep={handleRunStep} />}
        </main>

        {/* Right Control Panel Desk (~20-23% width, Fixed Action CTAs) */}
        <ControlPanel
          project={project}
          selectedStep={activeStep}
          runningStep={runningStep}
          userStyle={userStyle}
          onChangeUserStyle={setUserStyle}
          onRunStep={handleRunStep}
          onRecoverStep={handleRecoverStuckStep}
          recovering={recovering}
        />
      </div>

      {/* Fixed Bottom Navigation Bar (Height-Locked: 56px) */}
      <BottomNav
        project={project}
        selectedStep={activeStep}
        onSelectStep={stepNum => setActiveStep(stepNum)}
        autoAdvance={autoAdvance}
        onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
        onRunStep={handleRunStep}
      />

      {/* Source Manuscript Drawer */}
      <BookTextDrawer
        isOpen={isBookDrawerOpen}
        onClose={() => setIsBookDrawerOpen(false)}
        title={project.title}
        bookText={project.bookText}
      />
    </div>
  );
}
