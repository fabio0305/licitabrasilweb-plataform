import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '@/middleware/errorHandler';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  next(error);
};
