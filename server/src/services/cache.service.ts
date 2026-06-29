import { getRedis } from "../config/redis.js";

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const CACHE_TTL = {
  GITHUB_SEARCH: 900,
  GITHUB_REPO: 3600,
  RECOMMENDATIONS: 600
} as const;

const pruneExpired = (key: string) => {
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const client = getRedis();

  if (client) {
    try {
      const raw = await client.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // fall through to memory cache
    }
  }

  pruneExpired(key);
  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return null;

  return JSON.parse(entry.value) as T;
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> => {
  const serialized = JSON.stringify(value);
  const client = getRedis();

  if (client) {
    try {
      await client.setex(key, ttlSeconds, serialized);
      return;
    } catch {
      // fall through to memory cache
    }
  }

  memoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

export const cacheDel = async (pattern: string): Promise<void> => {
  const client = getRedis();

  if (client) {
    try {
      if (pattern.includes("*")) {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await client.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100
          );
          cursor = nextCursor;
          if (keys.length > 0) await client.del(...keys);
        } while (cursor !== "0");
      } else {
        await client.del(pattern);
      }
    } catch {
      // fall through to memory cache
    }
  }

  if (pattern.includes("*")) {
    const prefix = pattern.replace(/\*$/, "");
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  } else {
    memoryCache.delete(pattern);
  }
};

export const cacheKey = (...parts: string[]) => parts.join(":");
