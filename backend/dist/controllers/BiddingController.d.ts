import { Request, Response } from 'express';
export declare class BiddingController {
    listPublic(req: Request, res: Response): Promise<void>;
    getPublicById(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    publish(req: Request, res: Response): Promise<void>;
    cancel(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    openBidding(biddingId: string): Promise<void>;
    closeBidding(biddingId: string): Promise<void>;
}
//# sourceMappingURL=BiddingController.d.ts.map