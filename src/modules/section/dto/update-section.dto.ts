// src/section/dto/update-section.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSectionDto {
    @ApiProperty({
        description: 'The name of the section',
        example: 'Sciences',
      })
      @IsNotEmpty({ message: 'Section name should not be empty' })
      @IsString({ message: 'Section name must be a string' })
      name: string;
    }