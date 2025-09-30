interface CacheOptions {
    ttl?: number;
}
export declare class CacheService {
    private static instance;
    private readonly defaultTTL;
    private constructor();
    static getInstance(): CacheService;
    set(key: string, value: any, options?: CacheOptions): Promise<boolean>;
    get<T = any>(key: string): Promise<T | null>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    flush(): Promise<boolean>;
    getStats(): Promise<{
        hits: number;
        misses: number;
        hitRate: number;
        totalKeys: number;
        memoryUsage: number;
    }>;
}
declare const cacheService: CacheService;
export default cacheService;
export { cacheService };
//# sourceMappingURL=cacheService.d.ts.map