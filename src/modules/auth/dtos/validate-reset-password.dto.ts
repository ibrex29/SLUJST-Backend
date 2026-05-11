import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateResetTokenDto {
  @ApiProperty({ example: 'reset-token-here' })
  @IsString()
  token: string;
}