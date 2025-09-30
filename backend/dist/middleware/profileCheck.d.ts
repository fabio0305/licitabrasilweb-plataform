import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export declare const requireCompleteProfile: (requiredRole: UserRole) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireSupplierProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePublicEntityProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireCitizenProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireResourceOwnership: (resourceType: "supplier" | "publicEntity" | "citizen") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireBiddingAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireProposalAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireContractAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=profileCheck.d.ts.map