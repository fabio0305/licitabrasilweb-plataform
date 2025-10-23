import { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
    path?: string;
    method?: string;
}
export declare class AppError extends Error implements CustomError {
    statusCode: number;
    code: string;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: any);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: any);
}
export declare class ExternalServiceError extends AppError {
    constructor(message: string, details?: any);
}
export declare const errorHandler: (error: CustomError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const handleUncaughtErrors: () => void;
//# sourceMappingURL=errorHandler.d.ts.map