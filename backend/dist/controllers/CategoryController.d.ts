import { Request, Response } from 'express';
export declare class CategoryController {
    list(req: Request, res: Response): Promise<void>;
    getTree(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    private isDescendant;
}
//# sourceMappingURL=CategoryController.d.ts.map