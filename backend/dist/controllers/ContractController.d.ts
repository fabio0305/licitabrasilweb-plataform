import { Request, Response } from 'express';
export declare class ContractController {
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    activate(req: Request, res: Response): Promise<void>;
    suspend(req: Request, res: Response): Promise<void>;
    terminate(req: Request, res: Response): Promise<void>;
    sign(req: Request, res: Response): Promise<void>;
    complete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ContractController.d.ts.map