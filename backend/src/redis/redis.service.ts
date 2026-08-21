import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  onModuleInit() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    const options: RedisOptions = {
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        // Exponential backoff capped at 2 seconds
        const delay = Math.min(times * 150, 2000);
        return delay;
      },
    };

    this.client = new Redis(options);

    this.client.on('connect', () => {
      this.logger.log(`Connecting to Redis at ${host}:${port}...`);
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.log(`✅ Redis connected and ready at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(`Redis connection error (${err.message}). Degraded to fail-open mode.`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed.');
    });

    // Attempt initial non-blocking connection
    try {
      const connectPromise = this.client.connect?.();
      if (connectPromise && typeof connectPromise.catch === 'function') {
        connectPromise.catch((err) => {
          this.isConnected = false;
          this.logger.warn(`Initial Redis connection failed: ${err.message}. Fail-open mode active.`);
        });
      }
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(`Initial Redis connect call failed: ${err.message}. Fail-open mode active.`);
    }
  }


  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.isConnected = false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }
}
