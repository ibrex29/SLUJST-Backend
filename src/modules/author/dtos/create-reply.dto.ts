import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({
    example: 'd7a9e15d-3b22-45f8-96c2-0ed78d4f85d4',
    description: 'The unique identifier of the review being replied to',
  })
  @IsUUID()
  @IsNotEmpty()
  reviewId: string;

  @ApiProperty({
    example: 'Re: Your Review Comments',
    description: 'Subject of the reply',
  })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({
    example: 'Thank you for your comments. Here are the revisions made...',
    description: 'Contents of the reply',
  })
  @IsNotEmpty()
  @IsString()
  contents: string;

  @ApiProperty({
    example: 'http://example.com/uploads/revised-manuscript.pdf',
    description: 'Optional link to uploaded files',
  })
  @IsOptional()
  @IsString()
  uploadFiles?: string;  // This should be optional
}
