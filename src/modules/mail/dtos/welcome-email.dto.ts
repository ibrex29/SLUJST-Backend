import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWelcomeEmailDto {
  @ApiProperty({
    description: 'The email address of the recipient',
    example: 'user@example.com', // Example email
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The name of the recipient (optional)',
    example: 'John Doe', // Example name
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string; // Made optional by adding "?"
}
