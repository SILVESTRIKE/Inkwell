import { Request } from 'express';

const transformPaths = (data: any, baseUrl: string, parentData?: any): any => {
  if (data === null || typeof data !== 'object' || data instanceof Date) return data;
  if (Array.isArray(data)) return data.map((item) => transformPaths(item, baseUrl, parentData));

  const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };
  if (obj._id) {
    obj._id = obj._id.toString();
    obj.id = obj._id;
  }

  const createUrl = (filePath: string) => {
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${baseUrl}${cleanPath.replace(/\\/g, '/')}`;
  };

  if (typeof obj.mediaPath === 'string') {
    obj.mediaUrl = createUrl(obj.mediaPath);
  }

  if (typeof obj.portraitFilename === 'string') {
    const pId = obj.projectId || parentData?.id || parentData?._id;
    if (pId) {
      const cleanPid = typeof pId === 'object' ? pId.toString() : pId;
      obj.portraitUrl = createUrl(`/api/media/files/${cleanPid}/${obj.portraitFilename}`);
    }
  }

  if (typeof obj.illustrationFilename === 'string') {
    const pId = obj.projectId || parentData?.id || parentData?._id;
    if (pId) {
      const cleanPid = typeof pId === 'object' ? pId.toString() : pId;
      obj.illustrationUrl = createUrl(`/api/media/files/${cleanPid}/${obj.illustrationFilename}`);
    }
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const childData = obj._id || obj.id ? { ...obj, projectId: (obj.id || obj._id).toString() } : parentData;
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
