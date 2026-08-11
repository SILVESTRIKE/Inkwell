const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface StepState {
  stepNumber: number;
  stepName: 'style' | 'characters' | 'portraits' | 'chapters' | 'illustrations';
  status: 'pending' | 'running' | 'done' | 'failed';
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CharacterOutput {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  portraitFilename?: string;
}

export interface ChapterOutput {
  id: string;
  chapterTitle: string;
  description: string;
  illustrationPrompt: string;
  illustrationFilename?: string;
}

export interface ProjectData {
  _id: string;
  userId: string;
  title: string;
  bookText: string;
  overallStatus: 'draft' | 'in_progress' | 'done';
  currentStepNumber: number;
  stepStates: StepState[];
  outputs: {
    style?: {
      styleName?: string;
      description?: string;
      userStyle?: string;
    };
    characters?: CharacterOutput[];
    chapters?: ChapterOutput[];
  };
  createdAt: string;
  updatedAt: string;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('book_studio_session');
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    return parsed.token || null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return await response.json();
}

export const api = {
  async login(email: string, name: string): Promise<UserSession> {
    const data = await request<UserSession>('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('book_studio_session', JSON.stringify(data));
    }
    return data;
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('book_studio_session');
    }
  },

  async getProjects(): Promise<ProjectData[]> {
    return await request<ProjectData[]>('/api/projects');
  },

  async createProject(title: string, bookText: string): Promise<ProjectData> {
    return await request<ProjectData>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title, bookText }),
    });
  },

  async getProject(id: string): Promise<ProjectData> {
    return await request<ProjectData>(`/api/projects/${id}`);
  },

  async runStep(projectId: string, stepNumber: number, userStyle?: string): Promise<ProjectData> {
    const result = await request<{ message: string; jobId: string; project: ProjectData }>(
      `/api/projects/${projectId}/steps/${stepNumber}/run`,
      {
        method: 'POST',
        body: JSON.stringify({ userStyle }),
      }
    )
    return result.project
  },

  async recoverStep(projectId: string, stepNumber: number): Promise<ProjectData> {
    return await request<ProjectData>(`/api/projects/${projectId}/steps/${stepNumber}/recover`, {
      method: 'POST',
    });
  },

  getMediaUrl(projectId: string, filename: string): string {
    const token = getStoredToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/api/media/files/${projectId}/${filename}${tokenParam}`;
  },
};
