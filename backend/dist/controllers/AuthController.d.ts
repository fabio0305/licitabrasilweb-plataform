import { Request, Response } from 'express';
export declare class AuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refreshToken(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
    updateProfile(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<Response>;
    resetPassword(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=AuthController.d.ts.map