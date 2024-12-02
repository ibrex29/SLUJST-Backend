import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { JwtTokenService } from 'src/common/token/jwt-token.service';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { PrismaService } from 'prisma/prisma.service';
import { SITE_URL } from 'src/common/constants';
import { UserNotFoundException } from '../user/exceptions/UserNotFound.exception';

@Injectable()
export class PasswordService {
  private readonly siteUrl;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private userService: UserService,
    private jwtTokenService: JwtTokenService,
    private cryptoService: CryptoService,
    private prisma: PrismaService,
    // private mailService: MailService,
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
        password: await bcrypt.hash(newPassword, 10),
      },
    });
  }

  


}
