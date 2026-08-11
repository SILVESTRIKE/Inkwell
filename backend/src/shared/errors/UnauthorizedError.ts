import { CustomError } from './CustomError';

export class UnauthorizedError extends CustomError {
  statusCode = 401;

  constructor(public message: string = 'Not authorized') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
