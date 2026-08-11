import { CustomError } from './CustomError';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string = 'Bad request', public field?: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message, field: this.field }];
  }
}
