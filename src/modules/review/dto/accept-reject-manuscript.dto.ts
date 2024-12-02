// src/manuscripts/dtos/accept-reject-manuscript.dto.ts

import { IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptRejectManuscriptDto {
  @ApiProperty({
    description: 'ID of the manuscript to accept or reject',
    example: 'a1b2c3d4-e5f6-7g8h-9i10-jk11lm12no13', // Example manuscript ID
  })
  @IsString()
  manuscriptId: string;

  @ApiProperty({
    description: 'New status of the manuscript',
    enum: Status,
    example: Status.ACCEPTED,  // Example status value
  })
  @IsEnum(Status)
  status: Status;
}
