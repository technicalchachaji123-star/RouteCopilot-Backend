import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error Details:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const fields = err.fields || undefined;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      fields
    }
  });
};
