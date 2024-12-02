import { ApiProperty } from '@nestjs/swagger';
import { IsDate, isDate, IsDateString, IsISO8601, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
    description: 'The date by which the review is due',
    example: '2024-08-01T00:00:00.000Z',
  })

  @ApiProperty({
    description: 'The date by which the review is due',
    example: '2024-08-01T00:00:00.000Z',
  })

  @IsOptional()
  @IsDateString()
  reviewDueDate?: Date;

}