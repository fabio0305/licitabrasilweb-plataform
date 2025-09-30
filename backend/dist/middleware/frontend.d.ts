import { Request, Response, NextFunction } from 'express';
export declare const frontendIntegration: (req: Request, res: Response, next: NextFunction) => void;
export declare const paginationHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const frontendLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const frontendErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const userContextMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateFrontendOrigin: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const userRateLimit: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const developmentDebug: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=frontend.d.ts.map