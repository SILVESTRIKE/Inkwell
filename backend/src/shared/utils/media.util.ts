import { Request } from 'express';

const transformPaths = (data: any, baseUrl: string): any => {
  if (data === null || typeof data !== 'object' || data instanceof Date) return data;
  if (Array.isArray(data)) return data.map((item) => transformPaths(item, baseUrl));

  const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };

  const createUrl = (filePath: string) => {
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${baseUrl}${cleanPath.replace(/\\/g, '/')}`;
  };

  if (typeof obj.mediaPath === 'string') {
    obj.mediaUrl = createUrl(obj.mediaPath);
  }

  if (typeof obj.portraitFilename === 'string' && obj.projectId) {
    obj.portraitUrl = createUrl(`/api/media/files/${obj.projectId}/${obj.portraitFilename}`);
  }

  if (typeof obj.illustrationFilename === 'string' && obj.projectId) {
    obj.illustrationUrl = createUrl(`/api/media/files/${obj.projectId}/${obj.illustrationFilename}`);
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = transformPaths(obj[key], baseUrl);
    }
  }

  return obj;
};

export const transformMediaURLs = (req: Request, data: any): any => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (Array.isArray(data)) {
    return data.map((item) => transformPaths(item, baseUrl));
  }
  return transformPaths(data, baseUrl);
};
