// src/review/dto/create-review.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Recommendation } from '@prisma/client';
import { ReviewChecklistDto } from './checklist.dto';

export class CreateReviewDto {
  @ApiProperty({
    example: 'a3f1c2d4-58b7-4e6a-9c0d-1234567890ab',
    description: 'UUID of the manuscript being reviewed. Must be assigned to the authenticated reviewer.',
  })
  @IsUUID()
  @IsNotEmpty()
  manuscriptId: string;

  @ApiPropertyOptional({
    example:
      'The manuscript presents a solid contribution. The introduction is well-structured. ' +
      'However, the methodology section requires additional detail on dataset composition ' +
      'and hyperparameter tuning. Please also clarify the benchmark comparisons in Table 3.',
    description:
      'Review comments visible to the author after editorial approval. ' +
      'Optional — a review may consist of editor-only notes without author-facing comments.',
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    example:
      'The dataset used appears to overlap with a 2024 published benchmark. ' +
      'Recommend the editorial board verify originality before acceptance.',
    description:
      'Confidential notes for the editorial team only. ' +
      'This field is never exposed to the author under any circumstance.',
  })
  @IsString()
  @IsOptional()
  commentsForEditors?: string;

  @ApiProperty({
    enum: Recommendation,
    example: Recommendation.MINOR_REVISIONS,
    description:
      'Overall recommendation for the manuscript. ' +
      'One of: ACCEPT, MINOR_REVISIONS, MAJOR_REVISIONS, REJECT.',
  })
  @IsEnum(Recommendation)
  @IsNotEmpty()
  recommendation: Recommendation;

  @ApiPropertyOptional({
    type: () => ReviewChecklistDto,
    description: 'Structured checklist evaluating key quality dimensions of the manuscript.',
    example: {
      introduction: 'YES',
      researchDesign: 'CAN_BE_IMPROVED',
      methods: 'MUST_BE_IMPROVED',
      results: 'YES',
      conclusions: 'CAN_BE_IMPROVED',
      figuresAndTables: 'YES',
      englishQuality: 'FINE',
    },
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewChecklistDto)
  checklist?: ReviewChecklistDto;

  @ApiProperty({
    example: true,
    description:
      'Reviewer must confirm they did not use generative AI or AI-assisted tools ' +
      'to prepare this review. Submission is blocked if false.',
  })
  @IsBoolean()
  @IsNotEmpty()
  aiDeclarationConfirmed: boolean;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether the reviewer wishes to be notified of the final publication status of this manuscript.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyOnFinalStatus?: boolean;
}