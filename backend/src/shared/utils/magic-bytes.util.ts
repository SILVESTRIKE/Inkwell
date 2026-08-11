import fs from 'fs';
import { logger } from '../logger/logger';

const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]),
    Buffer.from([0xFF, 0xD8, 0xFF, 0xDB]),
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  ],
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]),
  ],
};

export function validateMagicBytes(filePath: string, expectedMime: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;

    // For plain text files (.txt), verify valid string encoding
    if (expectedMime === 'text/plain') {
      const sample = fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' });
      return typeof sample === 'string';
    }

    const expected = MAGIC_BYTES[expectedMime];
    if (!expected) return true;

    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, buffer, 0, 16, 0);
    } finally {
      fs.closeSync(fd);
    }

    const isValid = expected.some(magic => {
      const fileHeader = buffer.subarray(0, magic.length);
      return fileHeader.equals(magic);
    });

    if (!isValid) {
      logger.warn(`Magic bytes mismatch for ${filePath}. Expected ${expectedMime}`);
    } else {
      logger.debug(`File magic bytes validated for ${filePath}`);
    }

    return isValid;
  } catch (err) {
    logger.error('Magic bytes validation error:', err);
    return false;
  }
}
