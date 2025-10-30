import { Request, Response } from 'express';
export declare class UserController {
    private readonly ADMIN_PERMISSIONS;
    private grantAdminPermissions;
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    getUserPermissions(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map