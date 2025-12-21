/**
 * Redis Connection Module
 *
 * Provides a singleton Redis client for the application.
 * Handles connection, error handling, and graceful shutdown.
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // Required for BullMQ workers
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  // Connection event handlers
  redisClient.on("connect", () => {
    console.log(`[Redis] Connected to ${redisHost}:${redisPort}`);
  });

  redisClient.on("ready", () => {
    console.log("[Redis] Client is ready to receive commands");
  });

  redisClient.on("error", (err: Error) => {
    console.error("[Redis] Error:", err.message);
  });

  redisClient.on("close", () => {
    console.log("[Redis] Connection closed");
  });

  redisClient.on("reconnecting", () => {
    console.log("[Redis] Attempting to reconnect...");
  });

  return redisClient;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Connection closed successfully");
  }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redisClient?.status === "ready";
}

/**
 * Ping Redis to check connectivity
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch (error) {
    console.error("[Redis] Ping failed:", error);
    return false;
  }
}
