// src/section/dto/list-manuscripts-by-section.dto.ts

import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListManuscriptsBySectionDto {
  @ApiProperty({
    description: 'The ID of the section to retrieve manuscripts from.',
    example: '123e4567-e89b-12d3-a456-426614174000', // Example section ID
  })
  @IsNotEmpty()
  sectionId: string;
}
