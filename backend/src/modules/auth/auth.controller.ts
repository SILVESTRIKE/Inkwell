import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../shared/config/env';

const authService = new AuthService();

export class AuthController {
  async handleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name } = req.body;
      const result = await authService.findOrCreateUser(email, name);

      // Set Refresh Token in HttpOnly cookie to protect against XSS token theft
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.refreshAccessToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async handleLogout(req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  }
}
