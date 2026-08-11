import jwt from 'jsonwebtoken';
import { User, IUser } from './user.model';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/middleware/error.middleware';

export class AuthService {
  async findOrCreateUser(email: string, name: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    if (!email || !email.includes('@')) {
      throw new AppError(400, 'Valid email address is required');
    }
    if (!name || name.trim().length === 0) {
      throw new AppError(400, 'Name is required');
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
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: payload,
    };
  }
}
