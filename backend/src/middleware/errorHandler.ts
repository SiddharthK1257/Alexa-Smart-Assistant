import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Server Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  let statusCode = typeof err.statusCode === 'number' ? err.statusCode : typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'An unexpected error occurred';

  if (statusCode === 500) {
    if (message.includes('not found') || message.includes('access denied')) {
      statusCode = 404;
    } else if (message.includes('Confirmation required') || message.includes('cannot be empty')) {
      statusCode = 400;
    }
  }

  res.status(statusCode).json({
    error: statusCode === 404 ? 'Not Found' : statusCode === 400 ? 'Bad Request' : statusCode === 500 ? 'Internal Server Error' : 'Request Error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
