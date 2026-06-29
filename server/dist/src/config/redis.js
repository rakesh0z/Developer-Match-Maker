import { Redis } from "ioredis";
let redis = null;
let redisAvailable = false;
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
export const getRedis = () => {
    if (redis)
        return redisAvailable ? redis : null;
    try {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            enableOfflineQueue: false
        });
        redis.on("connect", () => {
            redisAvailable = true;
            console.log("Redis connected");
        });
        redis.on("error", () => {
            redisAvailable = false;
        });
        redis.connect().catch(() => {
            redisAvailable = false;
            console.warn("Redis unavailable — caching disabled");
        });
    }
    catch {
        redisAvailable = false;
        console.warn("Redis unavailable — caching disabled");
    }
    return redisAvailable ? redis : null;
};
export const isRedisAvailable = () => redisAvailable;
//# sourceMappingURL=redis.js.map