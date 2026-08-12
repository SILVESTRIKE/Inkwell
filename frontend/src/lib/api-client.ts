const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const STORAGE_KEY = 'inkwell_session';
const LEGACY_STORAGE_KEY = 'book_studio_session';

export interface UserSession {
  accessToken: string;
  refreshToken?: string;
  token?: string; // fallback for legacy payload
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt?: string;
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

function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  // Migration check: if legacy key exists, migrate it to inkwell_session
  const legacySession = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacySession && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, legacySession);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  const sessionStr = localStorage.getItem(STORAGE_KEY);
  if (!sessionStr) return null;

  try {
    const parsed: UserSession = JSON.parse(sessionStr);
    // Backwards compatibility normalization
    if (!parsed.accessToken && parsed.token) {
      parsed.accessToken = parsed.token;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  const session = getStoredSession();
  return session ? session.accessToken : null;
}

let refreshTokenPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const currentSession = getStoredSession();
      const refreshToken = currentSession?.refreshToken;

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      });

      if (!response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        return false;
      }

      const data = await response.json();
      if (currentSession && data.accessToken) {
        const updatedSession: UserSession = {
          ...currentSession,
          accessToken: data.accessToken,
          token: data.accessToken,
          refreshToken: data.refreshToken || currentSession.refreshToken,
          expiresAt: data.expiresAt || currentSession.expiresAt,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
        }
        return true;
      }
      return false;
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      return false;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}, retryOn401 = true): Promise<T> {
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
    credentials: 'include', // Include HttpOnly cookies on API requests
  });

  if (response.status === 401 && retryOn401) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.code === 'TOKEN_EXPIRED' || errorData.error === 'Access token expired') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request with new access token
        return request<T>(endpoint, options, false);
      }
    }
  }

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
    // Ensure accessToken field is set
    const sessionData: UserSession = {
      ...data,
      accessToken: data.accessToken || (data as any).token,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return sessionData;
  },

  async logout(): Promise<void> {
    try {
      await request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
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
    );
    return result.project;
  },

  async recoverStep(projectId: string, stepNumber: number): Promise<ProjectData> {
    return await request<ProjectData>(`/api/projects/${projectId}/steps/${stepNumber}/recover`, {
      method: 'POST',
    });
  },

  getMediaUrl(projectId: string, filename: string): string {
    const token = getStoredToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

    if (!filename) return '';

    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      if (!token || filename.includes('token=')) return filename;
      return `${filename}${filename.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    }

    if (filename.includes('/')) {
      const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
      return `${API_BASE_URL}/api/media/files${cleanPath}${tokenParam}`;
    }

    return `${API_BASE_URL}/api/media/files/${projectId}/${filename}${tokenParam}`;
  },
};
