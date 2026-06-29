export declare const CACHE_TTL: {
    readonly GITHUB_SEARCH: 900;
    readonly GITHUB_REPO: 3600;
    readonly RECOMMENDATIONS: 600;
};
export declare const cacheGet: <T>(key: string) => Promise<T | null>;
export declare const cacheSet: (key: string, value: unknown, ttlSeconds: number) => Promise<void>;
export declare const cacheDel: (pattern: string) => Promise<void>;
export declare const cacheKey: (...parts: string[]) => string;
//# sourceMappingURL=cache.service.d.ts.map