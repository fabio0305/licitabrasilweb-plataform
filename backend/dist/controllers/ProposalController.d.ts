import { Request, Response } from 'express';
export declare class ProposalController {
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    submit(req: Request, res: Response): Promise<void>;
    withdraw(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    evaluate(req: Request, res: Response): Promise<void>;
    accept(req: Request, res: Response): Promise<void>;
    reject(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ProposalController.d.ts.map