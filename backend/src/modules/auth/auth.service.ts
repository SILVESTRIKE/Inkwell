import jwt from 'jsonwebtoken';
import { User } from './user.model';
import { env } from '../../shared/config/env';
import { BadRequestError, UnauthorizedError } from '../../shared/errors';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  token: string; // Alias for backward-compatibility
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: string;
}

export class AuthService {
  async findOrCreateUser(email: string, name: string): Promise<AuthResult> {
    if (!email || !email.includes('@')) {
      throw new BadRequestError('Valid email address is required', 'email');
    }
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required', 'name');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({ email: normalizedEmail, name: name.trim() });
    } else if (user.name !== name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    const payload = { id: user._id.toString(), email: user.email, name: user.name };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: payload,
      expiresAt,
    };
  }

  async refreshAccessToken(token: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
    if (!token) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; email: string; name: string };
      const userPayload = { id: payload.id, email: payload.email, name: payload.name };

      const newAccessToken = jwt.sign(userPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
      const newRefreshToken = jwt.sign(userPayload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
