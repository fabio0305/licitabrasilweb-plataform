import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function connectDatabase(): Promise<PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>>;
export declare function disconnectDatabase(): Promise<void>;
export declare function executeTransaction<T>(callback: (prisma: any) => Promise<T>): Promise<T>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export { prisma };
export default prisma;
//# sourceMappingURL=database.d.ts.map