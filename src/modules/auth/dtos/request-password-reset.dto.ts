import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @ApiProperty({
      description: 'The email address of the user trying to log in',
      example: 'johndoe@example.com',
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}