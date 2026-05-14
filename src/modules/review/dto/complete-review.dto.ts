import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Recommendation } from '@prisma/client';

export class CompleteReviewDto {
  @ApiPropertyOptional({
    example:
      'The manuscript is well written and methodologically sound, but requires minor corrections.',
    description: 'Comments visible to the author',
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    example:
      'Recommend acceptance after addressing formatting and citation concerns.',
    description: 'Confidential comments visible only to editors',
  })
  @IsString()
  @IsOptional()
  commentsForEditors?: string;

  @ApiPropertyOptional({
    example: {
      originality: 'YES',
      methodology: 'CAN_BE_IMPROVED',
      references: 'MUST_BE_IMPROVED',
      grammar: 'YES',
    },
    description: 'Structured review checklist',
  })
  @IsOptional()
  checklist?: any;

  @ApiProperty({
    enum: Recommendation,
    example: Recommendation.MINOR_REVISIONS,
    description: 'Final reviewer recommendation',
  })
  @IsEnum(Recommendation)
  recommendation: Recommendation;

  @ApiProperty({
    example: true,
    description:
      'Reviewer confirms compliance with AI usage declaration policy',
  })
  @IsBoolean()
  aiDeclarationConfirmed: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify reviewer when final manuscript decision is made',
  })
  @IsBoolean()
  @IsOptional()
  notifyOnFinalStatus?: boolean;
}