/**
 * Extensões de tipos para Express
 */

import { JWTPayload } from 'jose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        status: string;
      } & JWTPayload;
    }
  }
}

export {};
