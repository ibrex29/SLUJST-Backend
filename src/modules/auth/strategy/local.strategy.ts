import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-local';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // if (!user.isActive) {
    //   throw new UnauthorizedException('Account is deactivated');
    // }

    // Extract role names from the roles array
    const roleNames = user.roles.map((role) => role.roleName);

    return {
      ...user,
      roles: roleNames,
    };
  }
}
