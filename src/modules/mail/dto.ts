import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendConfirmationDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the author submitting the manuscript',
  })
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty({
    example: 'The Future of AI',
    description: 'Title of the manuscript being submitted',
  })
  @IsString()
  @IsNotEmpty()
  manuscriptTitle: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Recipient email where the confirmation should be sent',
  })
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;
}
