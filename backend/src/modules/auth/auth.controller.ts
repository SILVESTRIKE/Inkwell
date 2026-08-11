import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../shared/config/env';

const authService = new AuthService();

export class AuthController {
  async handleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name } = req.body;
      const result = await authService.findOrCreateUser(email, name);

      // Set JWT in HttpOnly cookie to hide refresh token / session from client JS
      res.cookie('token', result.token, {
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
}
