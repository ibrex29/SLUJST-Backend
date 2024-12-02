// src/section/dto/create-section.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({
    description: 'The name of the section',
    example: 'Sciences',
  })
  @IsNotEmpty({ message: 'Section name should not be empty' })
  @IsString({ message: 'Section name must be a string' })
  name: string;
}
