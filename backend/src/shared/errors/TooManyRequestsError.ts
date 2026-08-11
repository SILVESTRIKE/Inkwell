import { CustomError } from './CustomError';

export class TooManyRequestsError extends CustomError {
  statusCode = 429;

  constructor(public message: string = 'Too many requests, please try again later') {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
