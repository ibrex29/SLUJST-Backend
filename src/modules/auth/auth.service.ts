import { Injectable } from '@nestjs/common';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { JwtTokenService } from 'src/common/token/jwt-token.service';
import { UserService } from 'src/modules/user/user.service';
import { JwtPayload } from './types';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtTokenService: JwtTokenService,
    private cryptoService: CryptoService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    const isMatch =
      user &&
      (await this.cryptoService.comparePassword(password, user.password));

    if (user && isMatch) {
      // remove password hash from result
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // return payload that will be used in user session
    // TODO: add user roles in payload for RoleGuard
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const tokens = await this.jwtTokenService.generateToken(payload);
    return {
      ...tokens,
      roles: payload.roles,
    };
  }

  async logout(token: string) {
    return this.jwtTokenService.blacklist(token);
  }
}
