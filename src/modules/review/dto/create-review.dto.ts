import { IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Recommendation } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({
    example: 'd7a9e15d-3b22-45f8-96c2-0ed78d4f85d4',
    description: 'The unique identifier of the manuscript being reviewed',
  })
  @IsUUID()
  @IsNotEmpty()
  manuscriptId: string;

  @ApiProperty({
    example: 'The manuscript is well-structured but requires minor revisions in the introduction section.',
    description: 'Comments about the manuscript',
  })
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({
    example: 'MINOR_REVISIONS',
    enum: Recommendation,
    description: 'The recommendation for the manuscript',
  })
  @IsEnum(Recommendation)
  @IsNotEmpty()
  recommendation: Recommendation;
}
