import { RedisClientType } from 'redis';
declare class RedisClient {
    private client;
    private isConnected;
    constructor();
    private setupEventListeners;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: string | object, expireInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    getObject<T>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<void>;
    flushAll(): Promise<void>;
    setSession(sessionId: string, sessionData: object, expireInSeconds?: number): Promise<void>;
    getSession<T>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<void>;
    checkHealth(): Promise<boolean>;
    getClient(): RedisClientType;
    isClientConnected(): boolean;
}
declare const redisClient: RedisClient;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export { redisClient };
export default redisClient;
//# sourceMappingURL=redis.d.ts.map