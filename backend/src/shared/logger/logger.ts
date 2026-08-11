import winston from 'winston';
import LokiTransport from 'winston-loki';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level}]: ${msg}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'production'
      ? combine(timestamp(), json())
      : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
  }),
];

// Optionally connect to Loki if running
if (process.env.LOKI_HOST) {
  try {
    transports.push(
      new LokiTransport({
        host: process.env.LOKI_HOST || 'http://localhost:3100',
        labels: { app: 'book-illustration-studio-backend' },
        json: true,
        format: json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.warn('Loki connection warning:', err),
      })
    );
  } catch (err) {
    console.warn('Could not initialize Loki transport:', err);
  }
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp()),
  transports,
});
