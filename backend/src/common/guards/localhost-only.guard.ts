import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Checks whether an IP address is a loopback or private internal network address (e.g. Docker bridge gateway).
 */
export function isLoopbackOrPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const cleanIp = ip.replace(/^::ffff:/, '').trim().toLowerCase();

  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp === '0.0.0.0'
  ) {
    return true;
  }

  // IPv4 10.0.0.0/8 & 192.168.0.0/16 private subnets
  if (cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
    return true;
  }

  // IPv4 172.16.0.0/12 (Docker bridge networks: 172.16.x.x - 172.31.x.x)
  const match172 = cleanIp.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

function hasValidAdminApiKey(providedKey: string | string[] | undefined, expectedKey: string): boolean {
  if (!providedKey || Array.isArray(providedKey)) {
    return false;
  }
  const providedBuf = Buffer.from(providedKey);
  const expectedBuf = Buffer.from(expectedKey);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Security guard that restricts endpoint access strictly to the local VM host / loopback and internal container network,
 * plus optional shared-secret verification when ADMIN_API_KEY is configured.
 * Any request originating from an external public IP or forwarded through a public reverse proxy is rejected with 403 Forbidden.
 */
@Injectable()
export class LocalhostOnlyGuard implements CanActivate {
  private readonly logger = new Logger(LocalhostOnlyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // 0. If ADMIN_API_KEY is configured in environment, verify x-admin-api-key header
    const configuredAdminKey = process.env.ADMIN_API_KEY;
    if (configuredAdminKey) {
      const providedKey = req.headers?.['x-admin-api-key'];
      if (!hasValidAdminApiKey(providedKey, configuredAdminKey)) {
        this.logger.warn('Rejected administrative request with missing or invalid x-admin-api-key');
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Access forbidden: valid administrative API key required.',
            error: 'Forbidden',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // 1. Inspect X-Forwarded-For header if present (reject if any hop in chain is a public IP)
    const forwardedHeader = req.headers?.['x-forwarded-for'];
    if (forwardedHeader) {
      const forwardedIps = forwardedHeader
        .toString()
        .split(',')
        .map((ip: string) => ip.trim())
        .filter(Boolean);

      const nonPrivateHop = forwardedIps.find((ip: string) => !isLoopbackOrPrivateIp(ip));
      if (nonPrivateHop) {
        this.logger.warn(`Rejected unauthorized request forwarded from public IP: ${nonPrivateHop}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Access forbidden: this endpoint is restricted to local VM execution only.',
            error: 'Forbidden',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // 2. Inspect Direct Connection IP (fail-closed if empty or non-private)
    const directIp =
      req.ip ||
      req.raw?.socket?.remoteAddress ||
      req.socket?.remoteAddress ||
      '';

    if (!isLoopbackOrPrivateIp(directIp)) {
      this.logger.warn(`Rejected unauthorized request from direct IP: ${directIp || '<empty>'}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Access forbidden: this endpoint is restricted to local VM execution only.',
          error: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
