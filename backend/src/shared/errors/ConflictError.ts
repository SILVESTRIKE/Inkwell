import { CustomError } from './CustomError';

export class ConflictError extends CustomError {
  statusCode = 409;

  constructor(public message: string = 'Resource conflict') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
