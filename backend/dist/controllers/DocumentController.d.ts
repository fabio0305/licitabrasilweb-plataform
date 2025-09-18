import { Request, Response } from 'express';
export declare class DocumentController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    upload(req: Request, res: Response): Promise<void>;
    download(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    private checkDocumentAccess;
    private checkEntityPermission;
}
//# sourceMappingURL=DocumentController.d.ts.map