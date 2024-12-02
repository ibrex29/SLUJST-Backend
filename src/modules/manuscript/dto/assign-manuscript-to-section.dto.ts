// src/manuscript/dto/assign-manuscript-to-section.dto.ts

import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManuscriptToSectionDto {
  @ApiProperty({
    description: 'The ID of the manuscript to assign to the section',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsNotEmpty({ message: 'Manuscript ID should not be empty' })
  manuscriptId: string;

  @ApiProperty({
    description: 'The ID of the section to assign the manuscript to',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsNotEmpty({ message: 'Section ID should not be empty' })
  sectionId: string;
}
