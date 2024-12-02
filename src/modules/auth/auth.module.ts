import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma/prisma.service';
import { LoginValidationMiddleware } from 'src/common/middlewares/login-validation.middleware';
import { JwtTokenService } from 'src/common/token/jwt-token.service';
import { UserModule } from 'src/modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AccessTokenStrategy } from './strategy/access-token.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PasswordService } from './password.service';

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthController],
  providers: [
    // RedisService,
    AuthService,
    PasswordService,
    LocalStrategy,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    JwtTokenService,
    // PasswordService,
    // MailService,
    PrismaService,
    {
      provide: APP_GUARD, // set api rate limiting globally (throttling)
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD, // set authentication globally
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoginValidationMiddleware).forRoutes({
      path: 'v1/auth/login/email',
      method: RequestMethod.POST,
    });
  }
}
