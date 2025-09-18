import { Request, Response } from 'express';
export declare class SupplierController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    verify(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    addCategory(req: Request, res: Response): Promise<void>;
    removeCategory(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=SupplierController.d.ts.map