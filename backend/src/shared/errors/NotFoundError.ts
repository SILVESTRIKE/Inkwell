import { CustomError } from './CustomError';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(public message: string = 'Resource not found', public field?: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, field: this.field }];
  }
}
