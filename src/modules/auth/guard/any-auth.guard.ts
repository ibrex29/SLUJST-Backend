import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from 'src/common/constants';
@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly guards: JwtAuthGuard[] ,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    for (const guard of this.guards) {
      if (guard instanceof AuthGuard) {
        const result = await guard.canActivate(context);

        if (result) {
          request.authType = guard.getStrategy();
          return true;
        }
      }
    }

    return false;
  }
}
