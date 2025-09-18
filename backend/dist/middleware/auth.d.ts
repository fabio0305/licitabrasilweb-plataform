import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSupplier: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePublicEntity: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAuditor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSupplierAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePublicEntityAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdminAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAuditAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyRefreshToken: (token: string) => JWTPayload;
export declare const blacklistToken: (token: string, expiresIn?: number) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map