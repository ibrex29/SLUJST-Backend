import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/modules/auth/types';
import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY,
  BLACKLISTED_TOKEN,
  MILLISECONDS_PER_SECOND,
} from '../constants';

@Injectable()
export class JwtTokenService {
  private JWT_ACCESS_SECRET: string;
  private JWT_ACCESS_EXPIRY: string;
  private JWT_REFRESH_SECRET: string;
  private JWT_REFRESH_EXPIRY: string;
  private JWT_RESET_PASSWORD_SECRET: string;
  private JWT_RESET_PASSWORD_EXPIRY: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.JWT_ACCESS_SECRET = this.configService.getOrThrow(JWT_ACCESS_SECRET);
    this.JWT_ACCESS_EXPIRY = this.configService.getOrThrow(JWT_ACCESS_EXPIRY);
    this.JWT_REFRESH_SECRET = this.configService.getOrThrow(JWT_REFRESH_SECRET);
    this.JWT_REFRESH_EXPIRY = this.configService.getOrThrow(JWT_REFRESH_EXPIRY);

    this.JWT_RESET_PASSWORD_SECRET = this.configService.getOrThrow(
      'JWT_RESET_PASSWORD_SECRET',
    );
    this.JWT_RESET_PASSWORD_EXPIRY = this.configService.getOrThrow(
      'JWT_RESET_PASSWORD_EXPIRY',
    );
  }

  async generateToken(payload: Partial<any>): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessTokenPromise = this.jwtService.signAsync(payload, {
      secret: this.JWT_ACCESS_SECRET,
      expiresIn: this.JWT_ACCESS_EXPIRY,
    });

    const refreshTokenPromise = this.jwtService.signAsync(payload, {
      secret: this.JWT_REFRESH_SECRET,
      expiresIn: this.JWT_REFRESH_EXPIRY,
    });

    const [accessToken, refreshToken] = await Promise.all([
      accessTokenPromise,
      refreshTokenPromise,
    ]);

    return { accessToken, refreshToken };
  }

  async generateResetPasswordToken(payload: Partial<any>): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.JWT_RESET_PASSWORD_SECRET,
      expiresIn: this.JWT_RESET_PASSWORD_EXPIRY,
    });
  }

  async verifyResetPasswordToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.JWT_RESET_PASSWORD_SECRET,
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.JWT_ACCESS_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.JWT_REFRESH_SECRET,
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.cacheManager.get(
      BLACKLISTED_TOKEN + token,
    );

    return !!blacklistedToken;
  }

  private extractExpirationTime(token: string): number | null {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      return decoded?.exp ?? null;
    } catch (error) {
      return null;
    }
  }

  async blacklist(token: string): Promise<void> {
    const expirationTime = this.extractExpirationTime(token);

    const expirationTimeMs = expirationTime
      ? (expirationTime - Math.floor(Date.now() / MILLISECONDS_PER_SECOND)) *
        MILLISECONDS_PER_SECOND
      : ms(this.JWT_ACCESS_EXPIRY);

    await this.cacheManager.set(
      BLACKLISTED_TOKEN + token,
      true,
      Math.floor(expirationTimeMs / 1000),
    );
  }
}