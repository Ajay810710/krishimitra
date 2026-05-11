import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const key = req.headers['x-admin-key'] as string | undefined;
    const expected = this.config.get<string>('ADMIN_SECRET', 'admin-secret-change-me');

    if (!key || key !== expected) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}
