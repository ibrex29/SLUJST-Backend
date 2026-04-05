// src/review/dto/checklist.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ChecklistValue {
  YES = 'YES',
  CAN_BE_IMPROVED = 'CAN_BE_IMPROVED',
  MUST_BE_IMPROVED = 'MUST_BE_IMPROVED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum EnglishQuality {
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  FINE = 'FINE',
}

export class ReviewChecklistDto {
  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.YES,
    description:
      'Does the introduction provide sufficient background and include all relevant references?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  introduction?: ChecklistValue;

  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.CAN_BE_IMPROVED,
    description: 'Is the research design appropriate?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  researchDesign?: ChecklistValue;

  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.MUST_BE_IMPROVED,
    description: 'Are the methods adequately described?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  methods?: ChecklistValue;

  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.YES,
    description: 'Are the results clearly presented?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  results?: ChecklistValue;

  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.CAN_BE_IMPROVED,
    description: 'Are the conclusions supported by the results?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  conclusions?: ChecklistValue;

  @ApiPropertyOptional({
    enum: ChecklistValue,
    example: ChecklistValue.YES,
    description: 'Are all figures and tables clear and well-presented?',
  })
  @IsOptional()
  @IsEnum(ChecklistValue)
  figuresAndTables?: ChecklistValue;

  @ApiPropertyOptional({
    enum: EnglishQuality,
    example: EnglishQuality.FINE,
    description: 'Overall quality of the English language used in the manuscript.',
  })
  @IsOptional()
  @IsEnum(EnglishQuality)
  englishQuality?: EnglishQuality;
}

// Type used in service layer for safe typing of the Json field
export interface ReviewChecklist {
  introduction?: ChecklistValue;
  researchDesign?: ChecklistValue;
  methods?: ChecklistValue;
  results?: ChecklistValue;
  conclusions?: ChecklistValue;
  figuresAndTables?: ChecklistValue;
  englishQuality?: EnglishQuality;
}