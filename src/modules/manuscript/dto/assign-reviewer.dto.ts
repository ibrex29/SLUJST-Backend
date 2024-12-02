import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AssignReviewerDto {
  @ApiProperty({
    description: 'The unique ID of the manuscript to which the reviewer will be assigned',
    example: 'c2d5d3f5-93e6-4a6f-9d48-06e5a2e3f3b0',
  })
  @IsUUID()
  manuscriptId: string;

  @ApiProperty({
    description: 'The unique ID of the reviewer who will be assigned to the manuscript',
    example: 'b1b8c0b5-3d2b-4b98-91e2-df27b27c104c',
  })
  @IsUUID()
  reviewerId: string;
  
  @ApiProperty({
    description: 'The due date for the review',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  reviewDueDate?: Date;
}
