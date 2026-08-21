import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

const LOCALHOST_IPS = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  'localhost',
]);

/**
 * Security guard that restricts endpoint access strictly to the local VM host / loopback network.
 * Any request originating from an external IP or forwarded through a public reverse proxy is rejected with 403 Forbidden.
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
      if (!LOCALHOST_IPS.has(clientIp)) {
        this.logger.warn(`Rejected unauthorized request forwarded from IP: ${clientIp}`);
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

    if (!LOCALHOST_IPS.has(directIp) && directIp !== '') {
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
