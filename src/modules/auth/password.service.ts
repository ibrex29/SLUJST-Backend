import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import { UserService } from '../user/user.service';
import { JwtTokenService } from 'src/common/token/jwt-token.service';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { PrismaService } from 'prisma/prisma.service';
import { SITE_URL } from 'src/common/constants';
import { UserNotFoundException } from '../user/exceptions/UserNotFound.exception';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PasswordService {
  private readonly siteUrl;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private userService: UserService,
    private jwtTokenService: JwtTokenService,
    private cryptoService: CryptoService,
    private prisma: PrismaService,
    private mailService: MailService,
    // private redisService: RedisService,
  ) {
    this.siteUrl = this.configService.get(SITE_URL);
  }

  async changePassword(userId: string, newPassword: string) {
    await this.userService.validateUserExists(userId);
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await bcryptjs.hash(newPassword, 10),
      },
    });
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new UserNotFoundException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token =
      await this.jwtTokenService.generateResetPasswordToken(payload);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.firstName + " " + user.lastName || user.email,
      resetUrl,
    );

    return {
      status: 'success',
      message: 'Password reset email sent successfully',
    };
  }

  async validatePasswordResetToken(token: string) {
    const payload = await this.jwtTokenService.verifyResetPasswordToken(token);

    return {
      status: 'success',
      message: 'Token is valid',
      data: payload,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtTokenService.verifyResetPasswordToken(token);

    await this.changePassword(payload.sub, newPassword);

    return {
      status: 'success',
      message: 'Password reset successfully',
    };
  }
}
