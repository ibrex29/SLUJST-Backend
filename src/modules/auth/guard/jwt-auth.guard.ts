import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  strategy: string;

  constructor(private reflector: Reflector) {
    super();
    this.strategy = 'jwt'; // Set the strategy name
  }

  canActivate(context: ExecutionContext) {
    this.logger.log('JwtAuthGuard canActivate called');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.logger.log('Public route, bypassing JWT guard');
      return true;
    }
    return super.canActivate(context);
  }

  public getStrategy() {
    return this.strategy;
  }
}
