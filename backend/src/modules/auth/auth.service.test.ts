import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AuthService } from './auth.service';
import { User } from './user.model';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inkwell-auth-test';
    try {
      await mongoose.connect(mongoUri);
    } catch {
      // ignore if already connected
    }
    authService = new AuthService();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a new user when email does not exist', async () => {
    const result = await authService.findOrCreateUser('newuser@example.com', 'New User');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('newuser@example.com');
    expect(result.user.name).toBe('New User');
    expect(result.token).toBeDefined();
  });

  it('should return existing user when email already exists', async () => {
    await authService.findOrCreateUser('existing@example.com', 'Existing User');
    const result = await authService.findOrCreateUser('existing@example.com', 'Existing User');

    expect(result.user.email).toBe('existing@example.com');
    const userCount = await User.countDocuments({ email: 'existing@example.com' });
    expect(userCount).toBe(1);
  });

  it('should throw BadRequestError when email is invalid', async () => {
    await expect(authService.findOrCreateUser('invalid-email', 'User')).rejects.toThrow(
      'Valid email address is required'
    );
  });

  it('should throw BadRequestError when name is empty', async () => {
    await expect(authService.findOrCreateUser('valid@example.com', '')).rejects.toThrow(
      'Name is required'
    );
  });
});
