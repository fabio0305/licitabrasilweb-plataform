import { Request, Response } from 'express';
export declare class UserController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map