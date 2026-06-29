import { getRedis } from "../config/redis.js";
const memoryCache = new Map();
export const CACHE_TTL = {
    GITHUB_SEARCH: 900,
    GITHUB_REPO: 3600,
    RECOMMENDATIONS: 600
};
const pruneExpired = (key) => {
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
        memoryCache.delete(key);
    }
};
export const cacheGet = async (key) => {
    const client = getRedis();
    if (client) {
        try {
            const raw = await client.get(key);
            if (raw)
                return JSON.parse(raw);
        }
        catch {
            // fall through to memory cache
        }
    }
    pruneExpired(key);
    const entry = memoryCache.get(key);
    if (!entry || entry.expiresAt <= Date.now())
        return null;
    return JSON.parse(entry.value);
};
export const cacheSet = async (key, value, ttlSeconds) => {
    const serialized = JSON.stringify(value);
    const client = getRedis();
    if (client) {
        try {
            await client.setex(key, ttlSeconds, serialized);
            return;
        }
        catch {
            // fall through to memory cache
        }
    }
    memoryCache.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000
    });
};
export const cacheDel = async (pattern) => {
    const client = getRedis();
    if (client) {
        try {
            if (pattern.includes("*")) {
                let cursor = "0";
                do {
                    const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
                    cursor = nextCursor;
                    if (keys.length > 0)
                        await client.del(...keys);
                } while (cursor !== "0");
            }
            else {
                await client.del(pattern);
            }
        }
        catch {
            // fall through to memory cache
        }
    }
    if (pattern.includes("*")) {
        const prefix = pattern.replace(/\*$/, "");
        for (const key of memoryCache.keys()) {
            if (key.startsWith(prefix))
                memoryCache.delete(key);
        }
    }
    else {
        memoryCache.delete(pattern);
    }
};
export const cacheKey = (...parts) => parts.join(":");
//# sourceMappingURL=cache.service.js.map