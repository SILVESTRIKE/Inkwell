import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

export async function ensureStorageDir(): Promise<void> {
  const dir = path.resolve(env.STORAGE_DIR);
  await fs.mkdir(dir, { recursive: true });
}

export async function saveProjectFile(projectId: string, filename: string, content: string | Buffer): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  const relativeSubdir = path.join('uploads', 'images', year, month);
  const targetDir = path.resolve(env.STORAGE_DIR, 'images', year, month);
  await fs.mkdir(targetDir, { recursive: true });

  const safeFilename = `${projectId}_${filename}`;
  const absolutePath = path.join(targetDir, safeFilename);
  await fs.writeFile(absolutePath, content);

  // Return relative path for database persistence (e.g. uploads/images/2026/08/...)
  return relativeSubdir.replace(/\\/g, '/') + '/' + safeFilename;
}

export async function readProjectFile(projectId: string, filename: string): Promise<Buffer> {
  const filePath = resolveStoragePath(filename.includes('/') ? filename : `${projectId}/${filename}`);
  return await fs.readFile(filePath);
}

export function resolveStoragePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (path.isAbsolute(normalized)) return normalized;
  if (normalized.startsWith('uploads/')) {
    return path.resolve(env.STORAGE_DIR, normalized.slice('uploads/'.length));
  }
  return path.resolve(env.STORAGE_DIR, normalized);
}

export function getProjectFilePath(projectId: string, filename: string): string {
  if (filename.includes('/')) {
    return resolveStoragePath(filename);
  }
  return path.resolve(env.STORAGE_DIR, projectId, filename);
}
