import { Request } from 'express';

const transformPaths = (data: any, baseUrl: string, parentData?: any): any => {
  if (data === null || typeof data !== 'object' || data instanceof Date) return data;
  if (Array.isArray(data)) return data.map((item) => transformPaths(item, baseUrl, parentData));

  const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };

  const createUrl = (filePath: string) => {
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${baseUrl}${cleanPath.replace(/\\/g, '/')}`;
  };

  if (typeof obj.mediaPath === 'string') {
    obj.mediaUrl = createUrl(obj.mediaPath);
  }

  if (typeof obj.portraitFilename === 'string') {
    const pId = obj.projectId || data.id || data._id;
    if (pId) {
      obj.portraitUrl = createUrl(`/api/media/files/${pId}/${obj.portraitFilename}`);
    }
  }

  if (typeof obj.illustrationFilename === 'string') {
    const pId = obj.projectId || data.id || data._id;
    if (pId) {
      obj.illustrationUrl = createUrl(`/api/media/files/${pId}/${obj.illustrationFilename}`);
    }
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const childData = obj._id || obj.id ? { ...obj, projectId: obj.id || obj._id } : data;
      obj[key] = transformPaths(obj[key], baseUrl, childData);
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
