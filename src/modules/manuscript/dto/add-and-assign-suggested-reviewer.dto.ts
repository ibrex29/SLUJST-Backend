
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class AddAndAssignSuggestedReviewerDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  suggestedReviewerId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({
    description: 'The due date for the review',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  reviewDueDate?: Date;
}