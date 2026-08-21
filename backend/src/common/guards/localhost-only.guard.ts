import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

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

/**
 * Security guard that restricts endpoint access strictly to the local VM host / loopback and internal container network.
 * Any request originating from an external public IP or forwarded through a public reverse proxy is rejected with 403 Forbidden.
 */
@Injectable()
export class LocalhostOnlyGuard implements CanActivate {
  private readonly logger = new Logger(LocalhostOnlyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // 1. Inspect X-Forwarded-For header if present (reject if proxied from external client)
    const forwardedHeader = req.headers?.['x-forwarded-for'];
    if (forwardedHeader) {
      const clientIp = forwardedHeader.toString().split(',')[0].trim();
      if (!isLoopbackOrPrivateIp(clientIp)) {
        this.logger.warn(`Rejected unauthorized request forwarded from public IP: ${clientIp}`);
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

    // 2. Inspect Direct Connection IP
    const directIp =
      req.ip ||
      req.raw?.socket?.remoteAddress ||
      req.socket?.remoteAddress ||
      '';

    if (!isLoopbackOrPrivateIp(directIp) && directIp !== '') {
      this.logger.warn(`Rejected unauthorized request from direct IP: ${directIp}`);
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
