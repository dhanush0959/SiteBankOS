import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import { IS_IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IS_IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isIdempotent) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const idempotencyKey = request.headers['x-idempotency-key'];
    const protocolVersion = request.headers['x-protocol-version'] || 'v1';

    if (!idempotencyKey) {
      throw new BadRequestException('x-idempotency-key header is required');
    }

    // Generate hash of the body to ensure payload matches
    const bodyString = JSON.stringify(request.body || {});
    const payloadHash = createHash('sha256').update(bodyString).digest('hex');
    const path = request.path;

    // Check if we already have this request
    const existingRecord = await this.prisma.idempotentRequest.findUnique({
      where: { idempotencyKey_protocolVersion: { idempotencyKey, protocolVersion } },
    });

    if (existingRecord) {
      // Replay check
      if (existingRecord.payloadHash !== payloadHash) {
        throw new ConflictException(
          'Idempotency conflict: The provided key was already used with a different payload.',
        );
      }

      this.logger.debug(`Replaying response for idempotency key: ${idempotencyKey}`);
      // Replay the response!
      response.status(existingRecord.statusCode);
      return of(existingRecord.responseBody);
    }

    // If no existing record, we proceed, but we must save the response after it finishes.
    return next.handle().pipe(
      tap(async (responseBody) => {
        // Save the successful response to the idempotency store
        try {
          await this.prisma.idempotentRequest.create({
            data: {
              idempotencyKey,
              protocolVersion,
              path,
              payloadHash,
              statusCode: response.statusCode || 200,
              responseBody: responseBody || {},
            },
          });
        } catch (e) {
          this.logger.warn(`Failed to store idempotency record for key ${idempotencyKey}`, e);
        }
      }),
    );
  }
}
