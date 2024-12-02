import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EmailLoginDto } from './dtos/email-login.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Public } from 'src/common/constants/routes.constant';
import { User } from 'src/common/decorators/param-decorator/User.decorator';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { PasswordService } from './password.service';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
  ) {}

  @Public()
  @Version('1')
  @Post('login/email')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Email login' })
  async emailLogin(@Request() req, @Body() emailLogin: EmailLoginDto) {
    console.log(req.user);
    return this.authService.login(req.user);
  }

  @Version('1')
  @Get('session')
  @ApiOperation({ summary: 'Get session details' })
  getSession(@Request() req) {
    console.log(req.user.userId);
    return req.user;
  }

  @Version('1')
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh token' })
  refresh(@Request() req) {
    return true;
  }

  @Version('1')
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Headers('authorization') authorizationHeader: string) {
    const accessToken = authorizationHeader.split(' ')[1]; // Extract the token

    // Add the token to the blacklist
    await this.authService.logout(accessToken);

    // Respond with a success message
    return { message: 'Logged out successfully' };
  }

  @Version('1')
  @Post('password/change')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: 201,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password',
  })

  async changePassword(
    @User('userId') userId: string,
    @User('email') email: string,
    @Body() changePasswordDTO: ChangePasswordDTO,
  ): Promise<any> {
    const passwordValid = await this.authService.validateUser(
      email,
      changePasswordDTO.oldPassword,
    );

    if (!!passwordValid) {
      await this.passwordService.changePassword(
        userId,
        changePasswordDTO.newPassword,
      );

      return {
        status: 'success',
        message: 'Password changed successfully',
      };
    } else {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid Password',
      });
    }
  }
}
