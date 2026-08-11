import { describe, it, expect } from 'vitest';
import { transformMediaURLs } from './media.util';

describe('media.util', () => {
  const dummyReq: any = {
    protocol: 'http',
    get: (header: string) => (header === 'host' ? 'localhost:4000' : ''),
  };

  it('should transform portraitFilename and illustrationFilename into absolute URLs', () => {
    const input = {
      projectId: 'proj-123',
      portraitFilename: 'portrait_char_1.png',
      illustrationFilename: 'scene_chap_1.png',
    };

    const output = transformMediaURLs(dummyReq, input);

    expect(output.portraitUrl).toBe('http://localhost:4000/api/media/files/proj-123/portrait_char_1.png');
    expect(output.illustrationUrl).toBe('http://localhost:4000/api/media/files/proj-123/scene_chap_1.png');
  });

  it('should transform mediaPath property to mediaUrl', () => {
    const input = {
      name: 'Test Image',
      mediaPath: '/api/media/files/proj-123/image.png',
    };

    const output = transformMediaURLs(dummyReq, input);

    expect(output.mediaUrl).toBe('http://localhost:4000/api/media/files/proj-123/image.png');
  });

  it('should handle arrays of objects seamlessly', () => {
    const inputList = [
      { projectId: 'p1', portraitFilename: 'char1.png' },
      { projectId: 'p2', illustrationFilename: 'chap1.png' },
    ];

    const outputList = transformMediaURLs(dummyReq, inputList);

    expect(outputList[0].portraitUrl).toBe('http://localhost:4000/api/media/files/p1/char1.png');
    expect(outputList[1].illustrationUrl).toBe('http://localhost:4000/api/media/files/p2/chap1.png');
  });
});
